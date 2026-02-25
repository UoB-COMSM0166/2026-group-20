/**
 * A class to handle key press input 
 * The input corresponds to the player movement 
 */

export class HandleInput {
   constructor(validKeys) {
      this.validKeys = validKeys;
      this.pressedKeys = []; 
   }
   /**
    * Add current key presses into the tracking list 
    * Also Check duplicates so the array won't increase forever
    * @param {string} k - The key string 
    */
   handleKeyPressed(k) {
      k = k.toLowerCase();
      if (this.validKeys.includes(k) && !this.pressedKeys.includes(k)) {
         this.pressedKeys.push(k);
      }
   }
   /**
    * Removes a key from the tracking list when it is released.
    * @param {string} k - The key string
    */
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

   /**
   * Get the 2 most recent unique presses.
   * @returns {string[]} An array of the last 2 keys
   */

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



