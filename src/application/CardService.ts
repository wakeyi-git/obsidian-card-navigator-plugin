import { App } from 'obsidian';
import { ICard, ICardDisplaySettings, CardContentType, CardRenderingCardSetSource, ICardStyle, ICardElementStyle } from '../domain/card/Card';
import { ICardFactory, CardFactory } from '../domain/card/CardFactory';
import { ICardRepository } from '../domain/card/CardRepository';
import CardNavigatorPlugin from '../main';

/**
 * 카드 서비스 인터페이스
 * 카드 관리를 위한 인터페이스입니다.
 */
export interface ICardService {
  /**
   * 모든 카드 가져오기
   * @returns 모든 카드 목록
   */
  getAllCards(): Promise<ICard[]>;
  
  /**
   * 현재 상태에 맞는 카드 가져오기
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 특정 ID의 카드 가져오기
   * @param id 카드 ID
   * @returns 카드 객체 또는 null
   */
  getCardById(id: string): Promise<ICard | null>;
  
  /**
   * 특정 경로의 카드 가져오기
   * @param path 카드 경로
   * @returns 카드 객체 또는 null
   */
  getCardByPath(path: string): Promise<ICard | null>;
  
  /**
   * 특정 태그를 가진 카드 가져오기
   * @param tag 태그
   * @returns 태그를 가진 카드 목록
   */
  getCardsByTag(tag: string): Promise<ICard[]>;
  
  /**
   * 특정 폴더의 카드 가져오기
   * @param folder 폴더 경로
   * @returns 폴더 내 카드 목록
   */
  getCardsByFolder(folder: string): Promise<ICard[]>;
  
  /**
   * 파일 경로 목록으로 카드 가져오기
   * @param paths 파일 경로 목록
   * @returns 카드 목록
   */
  getCardsByPaths(paths: string[]): Promise<ICard[]>;
  
  /**
   * 카드 저장소 초기화
   * 모든 카드를 다시 로드합니다.
   */
  refreshCards(): Promise<void>;
  
  /**
   * 카드에 표시 설정 적용
   * @param card 카드
   * @param settings 설정
   * @returns 표시 설정이 적용된 카드
   */
  applyDisplaySettings(card: ICard, settings: any): ICard;
  
  /**
   * 카드 내용 가져오기
   * @param card 카드
   * @param contentType 내용 타입 (문자열 또는 문자열 배열)
   * @param settings 설정
   * @returns 카드 내용
   */
  getCardContent(card: ICard, contentType: CardContentType | CardContentType[], settings: any): string;
}

/**
 * 카드 서비스 클래스
 * 카드 관리를 위한 클래스입니다.
 */
export class CardService implements ICardService {
  private app: App;
  private cardFactory: ICardFactory;
  private cardRepository: ICardRepository;
  
  // 성능 모니터링을 위한 카운터 추가
  private cardFetchCount = 0;
  private cacheHitCount = 0;
  private cacheMissCount = 0;
  
  constructor(app: App, cardRepository: ICardRepository) {
    this.app = app;
    this.cardFactory = new CardFactory();
    this.cardRepository = cardRepository;
  }
  
  async getAllCards(): Promise<ICard[]> {
    try {
      // 성능 측정 코드 제거 - 실제 기능 코드만 유지
      const cards = await this.cardRepository.getAllCards();
      return cards;
    } catch (error) {
      console.error('[CardService] 모든 카드 가져오기 오류:', error);
      throw error;
    }
  }
  
  async getCards(): Promise<ICard[]> {
    return this.getAllCards();
  }
  
  async getCardById(id: string): Promise<ICard | null> {
    try {
      const card = await this.cardRepository.getCardById(id);
      if (card) {
        this.cacheHitCount++;
        // 로그 출력만 유지하고 타이머 제거
        console.log(`[성능] CardService 캐시 히트 횟수: ${this.cacheHitCount}`);
      } else {
        this.cacheMissCount++;
        console.log(`[성능] CardService 캐시 미스 횟수: ${this.cacheMissCount}`);
      }
      
      return card;
    } catch (error) {
      console.error(`[성능] CardService.getCardById(${id}) 오류:`, error);
      return null;
    }
  }
  
  async getCardByPath(path: string): Promise<ICard | null> {
    try {
      const card = await this.cardRepository.getCardByPath(path);
      return card;
    } catch (error) {
      console.error('[성능] CardService.getCardByPath 오류:', error);
      return null;
    }
  }
  
  async getCardsByTag(tag: string): Promise<ICard[]> {
    return this.cardRepository.getCardsByTag(tag);
  }
  
  async getCardsByFolder(folder: string): Promise<ICard[]> {
    return this.cardRepository.getCardsByFolder(folder);
  }
  
  async getCardsByPaths(paths: string[]): Promise<ICard[]> {
    const cards: ICard[] = [];
    
    for (const path of paths) {
      const card = await this.getCardByPath(path);
      if (card) {
        cards.push(card);
      }
    }
    
    return cards;
  }
  
  async refreshCards(): Promise<void> {
    try {
      await this.cardRepository.refresh();
      console.log('[성능] CardService 카드 저장소 리프레시 완료');
    } catch (error) {
      console.error('[성능] CardService.refreshCards 오류:', error);
    }
  }
  
  /**
   * 파일 내용 가져오기
   * @param path 파일 경로
   * @returns 파일 내용
   */
  async getFileContent(path: string): Promise<string> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file && file.path === path) {
        return await this.app.vault.read(file as any);
      }
      return '';
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      return '';
    }
  }
  
  /**
   * 파일 내용 업데이트
   * @param path 파일 경로
   * @param content 새 내용
   * @returns 성공 여부
   */
  async updateFileContent(path: string, content: string): Promise<boolean> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file && file.path === path) {
        await this.app.vault.modify(file as any, content);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating file ${path}:`, error);
      return false;
    }
  }
  
  /**
   * 카드에 표시 설정 적용
   * @param card 카드
   * @param settings 설정
   * @returns 표시 설정이 적용된 카드
   */
  applyDisplaySettings(card: ICard, settings: any): ICard {
    // 카드 표시 설정 생성
    const displaySettings: ICardDisplaySettings = {
      headerContent: settings.cardHeaderContent || 'filename',
      bodyContent: settings.cardBodyContent || 'content',
      footerContent: settings.cardFooterContent || 'tags',
      renderingCardSetSource: settings.renderingCardSetSource || 'text',
      cardStyle: this.createCardStyleFromSettings(settings)
    };
    
    // 카드에 표시 설정 적용
    if (card) {
      card.displaySettings = displaySettings;
      
      // titleSource 설정에 따라 title 값 설정
      if (settings.titleSource === 'firstheader' && card.firstHeader) {
        card.title = card.firstHeader;
      }
    }
    
    return card;
  }
  
  /**
   * 설정에서 카드 스타일 생성
   * @param settings 설정
   * @returns 카드 스타일
   */
  private createCardStyleFromSettings(settings: any): ICardStyle {
    return {
      normal: {
        backgroundColor: settings.normalCardBgColor,
        borderStyle: settings.normalCardBorderStyle,
        borderColor: settings.normalCardBorderColor,
        borderWidth: settings.normalCardBorderWidth,
        borderRadius: settings.normalCardBorderRadius
      },
      active: {
        backgroundColor: settings.activeCardBgColor,
        borderStyle: settings.activeCardBorderStyle,
        borderColor: settings.activeCardBorderColor,
        borderWidth: settings.activeCardBorderWidth,
        borderRadius: settings.activeCardBorderRadius
      },
      focused: {
        backgroundColor: settings.focusedCardBgColor,
        borderStyle: settings.focusedCardBorderStyle,
        borderColor: settings.focusedCardBorderColor,
        borderWidth: settings.focusedCardBorderWidth,
        borderRadius: settings.focusedCardBorderRadius
      },
      header: {
        backgroundColor: settings.headerBgColor,
        fontSize: settings.headerFontSize,
        borderStyle: settings.headerBorderStyle,
        borderColor: settings.headerBorderColor,
        borderWidth: settings.headerBorderWidth,
        borderRadius: settings.headerBorderRadius
      },
      body: {
        backgroundColor: settings.bodyBgColor,
        fontSize: settings.bodyFontSize,
        borderStyle: settings.bodyBorderStyle,
        borderColor: settings.bodyBorderColor,
        borderWidth: settings.bodyBorderWidth,
        borderRadius: settings.bodyBorderRadius
      },
      footer: {
        backgroundColor: settings.footerBgColor,
        fontSize: settings.footerFontSize,
        borderStyle: settings.footerBorderStyle,
        borderColor: settings.footerBorderColor,
        borderWidth: settings.footerBorderWidth,
        borderRadius: settings.footerBorderRadius
      }
    };
  }
  
  /**
   * 카드 내용 가져오기
   * @param card 카드
   * @param contentType 내용 타입 (문자열 또는 문자열 배열)
   * @param settings 설정
   * @returns 카드 내용
   */
  getCardContent(card: ICard, contentType: CardContentType | CardContentType[], settings: any): string {
    if (!card) return '';
    
    // contentType이 배열인 경우 각 항목의 내용을 가져와서 결합
    if (Array.isArray(contentType)) {
      if (contentType.length === 0) {
        // 빈 배열인 경우 기본값 사용
        return '';
      }
      
      // 각 항목의 내용을 가져와서 결합
      const contents = contentType.map(type => this.getSingleCardContent(card, type, settings))
        .filter(content => content.trim() !== ''); // 빈 내용 제거
      
      if (contents.length === 0) return '';
      
      return contents.join('\n'); // 줄바꿈으로 결합
    }
    
    // 단일 contentType인 경우
    return this.getSingleCardContent(card, contentType, settings);
  }
  
  /**
   * 단일 내용 타입에 대한 카드 내용 가져오기
   * @param card 카드
   * @param contentType 내용 타입
   * @param settings 설정
   * @returns 카드 내용
   */
  private getSingleCardContent(card: ICard, contentType: CardContentType, settings: any): string {
    if (!card) return '';
    
    try {
      switch (contentType) {
        case 'filename':
        case 'title':
          return card.title || '';
          
        case 'firstheader':
          return card.firstHeader || '';
          
        case 'content':
          // 설정에 따라 내용 구성
          const shouldIncludeFrontmatter = settings.includeFrontmatterInContent;
          const shouldIncludeFirstHeader = settings.includeFirstHeaderInContent;
          
          // 결과 내용 구성
          let resultContent = '';
          let hasDivs = false;
          
          // 본문 내용 가져오기 (프론트매터 제거)
          let mainContent = card.content || '';
          
          // 프론트매터 제거 (---로 시작하고 ---로 끝나는 부분)
          const frontmatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n/;
          mainContent = mainContent.replace(frontmatterRegex, '').trim();
          
          // 첫 번째 헤더 추가
          if (shouldIncludeFirstHeader && card.firstHeader) {
            resultContent += `<div class="card-first-header"># ${card.firstHeader}</div>\n`;
            hasDivs = true;
          }
          
          // 프론트매터 추가
          if (shouldIncludeFrontmatter && card.frontmatter && Object.keys(card.frontmatter).length > 0) {
            // 프론트매터를 문자열로 변환
            const frontmatterStr = Object.entries(card.frontmatter)
              .map(([key, value]) => {
                if (Array.isArray(value)) {
                  return `${key}: [${value.join(', ')}]`;
                } else if (typeof value === 'object' && value !== null) {
                  return `${key}: ${JSON.stringify(value)}`;
                } else {
                  return `${key}: ${value}`;
                }
              })
              .join('\n');
            
            if (frontmatterStr.trim() !== '') {
              resultContent += `<div class="card-frontmatter">${frontmatterStr}</div>\n`;
              hasDivs = true;
            }
          }
          
          // 첫 번째 헤더 포함 여부에 따라 본문에서 첫 번째 헤더를 제거
          if (shouldIncludeFirstHeader === false && card.firstHeader && mainContent.includes(card.firstHeader)) {
            // 첫 번째 헤더 라인과 그 다음 빈 줄까지 제거
            const headerPattern = new RegExp(`#\\s*${card.firstHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n?`, 'i');
            mainContent = mainContent.replace(headerPattern, '').trim();
          }
          
          // 본문 내용은 div로 감싸지 않고 그대로 추가
          resultContent += mainContent;
          
          // HTML 태그가 포함된 경우 그대로 반환, 아니면 일반 텍스트로 반환
          return hasDivs ? resultContent : mainContent;
          
        case 'tags':
          return card.tags.map(tag => `#${tag}`).join(' ');
          
        case 'path':
          return card.path || '';
          
        case 'created':
          return `생성: ${new Date(card.created).toLocaleString()}`;
          
        case 'modified':
          return `수정: ${new Date(card.modified).toLocaleString()}`;
          
        case 'frontmatter':
          // 프론트매터 값 표시
          if (!card.frontmatter) return '';
          
          // 영역에 따른 프론트매터 키 결정
          let frontmatterKey = '';
          
          // 헤더, 본문, 푸터 중 어디에 속하는지 확인
          const headerContent = Array.isArray(settings.cardHeaderContent) 
            ? settings.cardHeaderContent 
            : [settings.cardHeaderContent];
            
          const bodyContent = Array.isArray(settings.cardBodyContent) 
            ? settings.cardBodyContent 
            : [settings.cardBodyContent];
            
          const footerContent = Array.isArray(settings.cardFooterContent) 
            ? settings.cardFooterContent 
            : [settings.cardFooterContent];
          
          if (headerContent.includes('frontmatter')) {
            frontmatterKey = settings.cardHeaderFrontmatterKey || '';
          } else if (bodyContent.includes('frontmatter')) {
            frontmatterKey = settings.cardBodyFrontmatterKey || '';
          } else if (footerContent.includes('frontmatter')) {
            frontmatterKey = settings.cardFooterFrontmatterKey || '';
          }
          
          // 프론트매터 키가 없으면 빈 문자열 반환
          if (!frontmatterKey) return '';
          
          // 프론트매터 키가 쉼표로 구분된 경우 분리
          const keys = frontmatterKey.split(',').map(key => key.trim());
          
          // 여러 키가 있는 경우 각 값을 가져와서 결합
          if (keys.length > 1) {
            return keys.map(key => {
              const value = card.frontmatter?.[key];
              if (value === undefined) return '';
              
              if (Array.isArray(value)) {
                return value.join(', ');
              }
              
              if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value);
              }
              
              return String(value);
            }).filter(v => v !== '').join(' | ');
          }
          
          // 단일 키인 경우
          const value = card.frontmatter[keys[0]];
          if (value === undefined) return '';
          
          // 배열인 경우 쉼표로 구분하여 표시
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          
          // 객체인 경우 JSON 문자열로 변환
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          
          // 그 외의 경우 문자열로 변환
          return String(value);
          
        default:
          // contentType이 문자열인 경우 프론트매터 키로 간주
          if (typeof contentType === 'string' && card.frontmatter) {
            const value = card.frontmatter[contentType];
            if (value !== undefined) {
              if (Array.isArray(value)) {
                return value.join(', ');
              }
              if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value);
              }
              return String(value);
            }
          }
          return '';
      }
    } catch (error) {
      console.error('카드 내용 가져오기 오류:', error);
      return '';
    }
  }
} 