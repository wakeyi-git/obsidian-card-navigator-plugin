import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import CardNavigatorPlugin from '../../../main';

/**
 * React 컴포넌트를 Obsidian 설정 탭에 렌더링하는 함수
 * @param Component 렌더링할 React 컴포넌트
 * @param containerEl 컴포넌트를 렌더링할 컨테이너 요소
 * @param plugin 플러그인 인스턴스
 * @returns 컴포넌트가 렌더링된 컨테이너 요소
 */
export function renderReactSettings(
  Component: React.ComponentType<{ plugin: CardNavigatorPlugin }>,
  containerEl: HTMLElement,
  plugin: CardNavigatorPlugin
): HTMLElement {
  // React 컴포넌트를 렌더링할 div 생성
  const reactContainer = containerEl.createDiv('card-navigator-react-container');
  
  // 설정 변경 핸들러 설정
  const handleSettingsChange = async () => {
    await plugin.saveSettings();
  };
  
  // React 컴포넌트 렌더링 (createRoot API 사용)
  const root = ReactDOM.createRoot(reactContainer);
  root.render(<Component plugin={plugin} />);
  
  return reactContainer;
}

/**
 * React 컴포넌트를 언마운트하는 함수
 * @param containerEl 컴포넌트가 렌더링된 컨테이너 요소
 */
export function unmountReactSettings(containerEl: HTMLElement): void {
  // React 18에서는 unmountComponentAtNode 대신 root.unmount() 사용
  // 하지만 root 객체를 저장해야 하므로 여기서는 간단히 컨테이너를 비웁니다.
  containerEl.empty();
} 