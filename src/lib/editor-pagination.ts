import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { pageGeometry } from "./writer-layout";

export const AutoPages = Extension.create({
  name: "autoPages",
  addProseMirrorPlugins() {
    const key = new PluginKey<DecorationSet>("autoPages");
    return [
      new Plugin({
        key,
        state: {
          init: () => DecorationSet.empty,
          // Conserve les séparations existantes pendant la frappe au lieu de tout détruire.
          apply: (tr, previous) => tr.getMeta(key) ?? previous.map(tr.mapping, tr.doc),
        },
        props: { decorations: (state) => key.getState(state) },
        view(view) {
          let timer: ReturnType<typeof setTimeout>;
          let running = false;

          const measure = () => {
            if (running || view.isDestroyed) return;
            running = true;

            try {
              const dom = view.dom;
              const style = getComputedStyle(dom);
              const paddingTop = parseFloat(style.paddingTop) || 40;
              const paddingBottom = parseFloat(style.paddingBottom) || paddingTop;
              const width = dom.clientWidth || 794;
              // Mesure la surface utile à l'intérieur d'une feuille A4 (210 × 297 mm).
              const pageHeight = pageGeometry(width, !!dom.closest(".orientation-Paysage")).height;
              const noteReserve = Number(dom.dataset["noteReserve"]) || 0;
              const usable = Math.max(120, pageHeight - paddingTop - paddingBottom - noteReserve);

              const decos: Decoration[] = [];
              let used = 0;
              let number = 1;

              view.state.doc.forEach((node, pos) => {
                const element = view.nodeDOM(pos);
                if (!(element instanceof HTMLElement)) return;
                const elementStyle = getComputedStyle(element);
                const marginTop = parseFloat(elementStyle.marginTop) || 0;
                const marginBottom = parseFloat(elementStyle.marginBottom) || 0;
                const height = element.getBoundingClientRect().height + marginTop + marginBottom;

                if (node.type.name === "pageBreak") {
                  const rest = Math.max(0, usable - used);
                  element.style.setProperty("height", `${rest + paddingTop + paddingBottom + 16}px`, "important");
                  element.style.setProperty("--gap-rest", `${rest}px`);
                  element.classList.add("writer-explicit-gap");
                  used = 0;
                  number++;
                  return;
                }

                // Le bloc entier passe à la page suivante plutôt que d'être coupé au milieu.
                if (used > 0 && used + height > usable) {
                  number++;
                  const currentPage = number;
                  const rest = Math.max(0, usable - used);
                  decos.push(
                    Decoration.widget(
                      pos,
                      () => {
                        const el = document.createElement("div");
                        el.className = "auto-page-gap";
                        el.style.setProperty("height", `${rest + paddingTop + paddingBottom + 16}px`, "important");
                        el.style.setProperty("--gap-rest", `${rest}px`);
                        el.setAttribute("contenteditable", "false");
                        el.dataset["nextPage"] = String(currentPage);
                        return el;
                      },
                      { side: -1, key: `page-break-${pos}` },
                    ),
                  );
                  used = 0;
                }
                used += height;
              });

              view.dispatch(view.state.tr.setMeta(key, DecorationSet.create(view.state.doc, decos)));
              dom.dataset["pages"] = String(number);
              // Toutes les pages, y compris la dernière, gardent la géométrie de référence A4.
              dom.style.setProperty("min-height", `${number * pageHeight + (number - 1) * 16}px`, "important");
            } finally {
              running = false;
            }
          };

          const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(measure, 180);
          };

          window.addEventListener("resize", schedule);
          view.dom.addEventListener("writer-layout-change", schedule);
          schedule();

          return {
            update: (v, old) => {
              if (!old.doc.eq(v.state.doc)) schedule();
            },
            destroy: () => {
              clearTimeout(timer);
              window.removeEventListener("resize", schedule);
              view.dom.removeEventListener("writer-layout-change", schedule);
            },
          };
        },
      }),
    ];
  },
});
