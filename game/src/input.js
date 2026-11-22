// input.js — keyboard and mouse input: the live key set, click-to-move
// targets, and a one-shot action queue (smoke / EMP / confirm).
export function createInput() {
  return {
    keys: new Set(),
    click: null,
    actions: [],
    pressed: new Set(),
    attach(canvas, onFirstGesture) {
      const self = this;
      window.addEventListener("keydown", (e) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
          e.preventDefault();
        }
        if (!e.repeat) {
          self.pressed.add(e.code);
          if (e.code === "KeyQ" || e.code === "Digit1") self.actions.push("smoke");
          if (e.code === "KeyE" || e.code === "Digit2") self.actions.push("emp");
        }
        self.keys.add(e.code);
        if (onFirstGesture) onFirstGesture();
      });
      window.addEventListener("keyup", (e) => {
        self.keys.delete(e.code);
      });
      canvas.addEventListener("mousedown", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 1280;
        const y = ((e.clientY - rect.top) / rect.height) * 720;
        self.click = { x, y };
        if (onFirstGesture) onFirstGesture();
      });
      window.addEventListener("blur", () => self.keys.clear());
    },
    wasPressed(code) {
      return this.pressed.has(code);
    },
    consumeAction(kind) {
      const i = this.actions.indexOf(kind);
      if (i === -1) return false;
      this.actions.splice(i, 1);
      return true;
    },
    endFrame() {
      this.pressed.clear();
      this.actions.length = 0;
    },
  };
}
