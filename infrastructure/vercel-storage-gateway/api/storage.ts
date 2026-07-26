import express from 'express';
import { createGateway } from '../src/gateway.js';

export const config = { maxDuration: 300 };
export default createGateway();
