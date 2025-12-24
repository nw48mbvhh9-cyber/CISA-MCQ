import { describe, it, expect } from 'vitest';
import { QuizInterface } from '../components/QuizInterface';
import App from '../App';

describe('Component Smoke Tests', () => {
    it('QuizInterface should be defined', () => {
        expect(QuizInterface).toBeDefined();
    });

    it('App should be defined', () => {
        expect(App).toBeDefined();
    });
});
