import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import CardNavigatorPlugin from '../../../main';

// 컴포넌트 루트 저장을 위한 맵
const rootMap = new Map<HTMLElement, ReactDOM.Root>();

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
  
  // 루트 객체 저장
  rootMap.set(reactContainer, root);
  
  return reactContainer;
}

/**
 * React 컴포넌트를 언마운트하는 함수
 * @param containerEl 컴포넌트가 렌더링된 컨테이너 요소
 */
export function unmountReactSettings(containerEl: HTMLElement): void {
  // 저장된 루트 객체 가져오기
  const root = rootMap.get(containerEl);
  
  if (root) {
    // React 18의 unmount 메서드 호출
    try {
      root.unmount();
      console.log('[ReactSettingsAdapter] 컴포넌트 언마운트 성공');
    } catch (error) {
      console.error('[ReactSettingsAdapter] 컴포넌트 언마운트 오류:', error);
    }
    
    // 맵에서 제거
    rootMap.delete(containerEl);
  }
  
  // 컨테이너 비우기
  containerEl.empty();
} 