export interface IViewService {
  initializeViews(): void;
  activateView(viewId: string): void;
  deactivateView(viewId: string): void;
  getActiveView(): string | null;
} 