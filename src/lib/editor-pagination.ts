import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

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
            const pageHeight = (width * 297) / 210;
            const usable = Math.max(300, pageHeight - padding * 2);

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
                used = 0;
                number++;
                return;
              }

              // Lorsque le texte remplit la page en cours, création de la page suivante à l'infini
              if (used > 0 && used + height > usable) {
                number++;
                const currentPage = number;
                decos.push(
                  Decoration.widget(
                    pos,
                    () => {
                      const el = document.createElement("div");
                      el.className = "auto-page-gap";
                      el.setAttribute("contenteditable", "false");
                      el.innerHTML = `<span class="page-gap-badge">Page ${currentPage}</span>`;
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
            running = false;
          };

          const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(measure, 180);
          };

          // Mesure uniquement sur redimensionnement de la fenêtre, sans boucle récursive
          window.addEventListener("resize", schedule);
          schedule();

          return {
            update: (v, old) => {
              if (!old.doc.eq(v.state.doc)) schedule();
            },
            destroy: () => {
              clearTimeout(timer);
              window.removeEventListener("resize", schedule);
            },
          };
        },
      }),
    ];
  },
});
