import p5 from "p5";
import { sketch } from "./sketch.js";

window.p5 = p5;  

await import("p5/lib/addons/p5.sound"); 

new p5(sketch);
