import { MAX_SEARCH_HISTORY } from 'common/types';

export class SearchHistory {
    private history: string[] = [];
    private maxSize: number;

    constructor(maxSize: number = MAX_SEARCH_HISTORY) {
        this.maxSize = maxSize;
    }

    add(term: string) {
        if (!term) return;
        this.history = this.history.filter(item => item !== term);
        this.history.unshift(term);
        if (this.history.length > this.maxSize) {
            this.history.pop();
        }
    }

    get recent(): string[] {
        return [...this.history];
    }

    clear() {
        this.history = [];
    }
} 