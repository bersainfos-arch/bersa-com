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
          // Conserve les séparations existantes pendant la frappe au lieu de tout détruire
          apply: (tr, previous) => tr.getMeta(key) ?? previous.map(tr.mapping, tr.doc),
        },
        props: { decorations: (state) => key.getState(state) },
        view(view) {
          let timer: ReturnType<typeof setTimeout>;
          let running = false;

          const measure = () => {
            if (running || view.isDestroyed) return;
            running = true;

            const dom = view.dom;
            const style = getComputedStyle(dom);
            const padding = parseFloat(style.paddingTop) || 40;
            const width = dom.clientWidth || 794;
            // Hauteur proportionnelle A4 (210 x 297)
            const pageHeight = pageGeometry(width).height;
            const usable = Math.max(120, pageHeight - padding * 2 - (Number(dom.dataset["noteReserve"]) || 0));

            const decos: Decoration[] = [];
            let used = 0;
            let number = 1;

            view.state.doc.forEach((node, pos) => {
              const element = view.nodeDOM(pos);
              if (!(element instanceof HTMLElement)) return;
              const height =
                element.getBoundingClientRect().height +
                parseFloat(getComputedStyle(element).marginBottom || "0");

              if (node.type.name === "pageBreak") {
                const rest = Math.max(0, pageHeight - padding * 2 - used);
                element.style.setProperty("height", `${rest + padding * 2 + 16}px`, "important");
                element.style.setProperty("--gap-rest", `${rest}px`);
                element.classList.add("writer-explicit-gap");
                used = 0;
                number++;
                return;
              }

              // Lorsque le texte remplit la page en cours, création de la page suivante à l'infini
              if (used > 0 && used + height > usable) {
                number++;
                const currentPage = number;
                const rest = Math.max(0, pageHeight - padding * 2 - used);
                decos.push(
                  Decoration.widget(
                    pos,
                    () => {
                      const el = document.createElement("div");
                      el.className = "auto-page-gap";
                      el.style.setProperty("height", `${rest + padding * 2 + 16}px`, "important");
                      el.style.setProperty("--gap-rest", `${rest}px`);
                      el.setAttribute("contenteditable", "false");
                      el.dataset["nextPage"] = String(currentPage);
                      return el;
                    },
                    { side: -1, key: `page-break-${pos}` }
                  )
                );
                used = 0;
              }
              used += height;
            });

            view.dispatch(
              view.state.tr.setMeta(key, DecorationSet.create(view.state.doc, decos))
            );
            dom.dataset["pages"] = String(number);
            // Chaque page garde exactement la même hauteur A4, y compris la dernière
            dom.style.setProperty("min-height", `${number * pageHeight + (number - 1) * 16}px`, "important");
            running = false;
          };

          const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(measure, 180);
          };

          // Mesure uniquement sur redimensionnement de la fenêtre, sans boucle récursive
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
