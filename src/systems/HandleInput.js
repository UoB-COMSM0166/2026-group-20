
export class HandleInput {
   constructor(validKeys) {
      this.validKeys = validKeys;
      this.pressedKeys = [];
   }

   handleKeyPressed(k) {
      k = k.toLowerCase();
      this.pressedKeys.push(k);
   }

   handleKeyReleased(k) {
      k = k.toLowerCase();
      const index = this.pressedKeys.indexOf(k);
      if (index !== -1) {
         this.pressedKeys.splice(index, 1);
      }
   }

   //getLastPressed() {
   //   return this.pressedKeys[this.pressedKeys.length - 1];
   //}
  
   getLast2Pressed() {
      const len = this.pressedKeys.length;
      if (len >= 2) {
         return [this.pressedKeys[len - 2], this.pressedKeys[len - 1]];
      } 
      else if (len === 1) {
         return [this.pressedKeys[0]];
      } 
      else {
         return [];
      }
   }

}



