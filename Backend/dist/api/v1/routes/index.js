"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerV1Routes = registerV1Routes;
const score_1 = require("./score");
function registerV1Routes(app) {
    app.use('/api/v1/ats', score_1.atsRouter);
}
