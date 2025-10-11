import { Router } from 'express';
import { getExample, createExample } from '../controllers/exampleController';

export const exampleRouter = Router();

exampleRouter.get('/', getExample);
exampleRouter.post('/', createExample);