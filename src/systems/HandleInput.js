export class HandleInput {
    constructor(p, playerIndex) {
        this.p = p;
        this.idx = playerIndex;
    }

    get left() {
        if (this.idx === 0) return this.p.keyIsDown(65);
        return this.p.keyIsDown(this.p.LEFT_ARROW);
    }

    get right() {
        if (this.idx === 0) return this.p.keyIsDown(68);
        return this.p.keyIsDown(this.p.RIGHT_ARROW);
    }

    get jump() {
        if (this.idx === 0) return this.p.keyIsDown(87);
        return this.p.keyIsDown(this.p.UP_ARROW);
    }
}