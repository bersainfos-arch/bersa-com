import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
export const AutoPages = Extension.create({
  name: "autoPages",
  addProseMirrorPlugins() {
    const key = new PluginKey<DecorationSet>("autoPages");
    return [new Plugin({
      key,
      state: {
        init: () => DecorationSet.empty,
        apply: (tr, previous) => tr.getMeta(key) ?? (tr.docChanged ? DecorationSet.empty : previous.map(tr.mapping, tr.doc)),
      },
      props: { decorations: state => key.getState(state) },
      view(view) {
        let timer: ReturnType<typeof setTimeout>;
        let running = false;
        const measure = () => {
          if (running || view.isDestroyed) return;
          running = true;
          const dom = view.dom;
          const style = getComputedStyle(dom);
          const padding = parseFloat(style.paddingTop);
          const width = dom.clientWidth;
          const pageHeight = width * 297 / 210;
          const usable = pageHeight - padding * 2;
          const decos: Decoration[] = [];
          let used = 0;
          let number = 1;
          view.state.doc.forEach((node, pos) => {
            const element = view.nodeDOM(pos);
            if (!(element instanceof HTMLElement)) return;
            const height = element.getBoundingClientRect().height + parseFloat(getComputedStyle(element).marginBottom || "0");
            if (node.type.name === "pageBreak") { used = 0; number++; return; }
            if (used > 0 && used + height > usable) {
              const rest = Math.max(0, usable - used);
              const gap = rest + padding * 2 + 18;
              number++;
              decos.push(Decoration.widget(pos, () => {
                const el = document.createElement("div");
                el.className = "auto-page-gap";
                el.style.height = `${gap}px`;
                el.style.setProperty("--rest", `${rest}px`);
                el.setAttribute("contenteditable", "false");
                el.dataset['page'] = String(number);
                return el;
              }, { side: -1, key: `page-${pos}-${Math.round(gap)}` }));
              used = 0;
            }
            used += height;
          });
          view.dispatch(view.state.tr.setMeta(key, DecorationSet.create(view.state.doc, decos)));
          dom.dataset['pages'] = String(number);
          running = false;
        };
        const schedule = () => { clearTimeout(timer); timer = setTimeout(measure, 200); };
        const resize = new ResizeObserver(schedule); resize.observe(view.dom);
        schedule();
        return { update: (v, old) => { if (!old.doc.eq(v.state.doc)) schedule(); }, destroy: () => { clearTimeout(timer); resize.disconnect(); } };
      },
    })];
  },
});
