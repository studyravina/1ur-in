import { Router, type IRouter } from "express";
import healthRouter from "./health";
import urlsRouter from "./urls";
import userRouter from "./user";
import paymentsRouter from "./payments";
import apiKeysRouter from "./apikeys";
import apiPublicRouter from "./apiPublic";

const router: IRouter = Router();

router.use(healthRouter);
router.use(urlsRouter);
router.use(userRouter);
router.use(paymentsRouter);
router.use(apiKeysRouter);
router.use(apiPublicRouter);

export default router;
