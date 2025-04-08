"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_favicon_1 = __importDefault(require("express-favicon"));
const morgan_1 = __importDefault(require("morgan"));
const mainRouter_1 = __importDefault(require("./routes/mainRouter"));
const plans_1 = __importDefault(require("./routes/plans"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const app = (0, express_1.default)();
// middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.static('public'));
app.use((0, express_favicon_1.default)(__dirname + '/public/favicon.ico'));
// routes
app.use('/api/v1', mainRouter_1.default);
app.use('/api/v1/plans', plans_1.default);
const swaggerDocument = yamljs_1.default.load('./swagger.yaml');
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
exports.default = app;
