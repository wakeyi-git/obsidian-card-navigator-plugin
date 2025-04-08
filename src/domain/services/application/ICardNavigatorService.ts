import { ICard } from '../../models/Card';
import { ICardSet } from '../../models/CardSet';
import { ISearchConfig } from '../../models/Search';
import { ISortConfig } from '../../models/Sort';
import { IPluginSettings } from '../../models/PluginSettings';
import { IRenderConfig } from '../../models/Card';
import { ICardStyle } from '../../models/Card';

/**
 * 카드 내비게이터 서비스 인터페이스
 * 카드 내비게이션과 관련된 모든 기능을 제공합니다.
 */
export interface ICardNavigatorService {
    /**
     * 카드셋에 해당하는 카드들을 가져옵니다.
     * @param cardSet 카드셋
     * @returns 카드 배열
     */
    getCards(cardSet: ICardSet): Promise<ICard[]>;

    /**
     * ID로 카드를 가져옵니다.
     * @param cardId 카드 ID
     * @returns 카드 또는 null
     */
    getCardById(cardId: string): Promise<ICard | null>;

    /**
     * 검색 결과에 해당하는 카드들을 가져옵니다.
     * @param query 검색어
     * @param config 검색 설정
     * @returns 카드 배열
     */
    searchCards(query: string, config: ISearchConfig): Promise<ICard[]>;

    /**
     * 카드들을 정렬합니다.
     * @param cards 카드 배열
     * @param config 정렬 설정
     * @returns 정렬된 카드 배열
     */
    sortCards(cards: ICard[], config: ISortConfig): ICard[];

    /**
     * 카드를 렌더링합니다.
     * @param card 카드
     * @returns 렌더링된 HTML 요소
     */
    renderCard(card: ICard): HTMLElement;

    /**
     * 카드 표시 옵션을 적용합니다.
     * @param card 카드
     * @param settings 플러그인 설정
     */
    applyDisplayOptions(card: ICard, settings: IPluginSettings): void;

    /**
     * 카드에 포커스를 설정합니다.
     * @param card 카드
     */
    focusCard(card: ICard): void;

    /**
     * 프리셋을 저장합니다.
     * @param name 프리셋 이름
     * @param settings 플러그인 설정
     */
    savePreset(name: string, settings: IPluginSettings): Promise<void>;

    /**
     * 프리셋을 불러옵니다.
     * @param name 프리셋 이름
     * @returns 플러그인 설정
     */
    loadPreset(name: string): Promise<IPluginSettings>;

    /**
     * 폴더에 프리셋을 매핑합니다.
     * @param folderPath 폴더 경로
     * @param presetName 프리셋 이름
     */
    mapPresetToFolder(folderPath: string, presetName: string): Promise<void>;

    /**
     * 태그에 프리셋을 매핑합니다.
     * @param tag 태그
     * @param presetName 프리셋 이름
     */
    mapPresetToTag(tag: string, presetName: string): Promise<void>;

    /**
     * 카드 간 링크를 생성합니다.
     * @param sourceCard 소스 카드
     * @param targetCard 타겟 카드
     */
    createLinkBetweenCards(sourceCard: ICard, targetCard: ICard): void;

    /**
     * 카드로 스크롤합니다.
     * @param card 카드
     */
    scrollToCard(card: ICard): void;

    /**
     * 컨테이너의 크기를 가져옵니다.
     * @returns 컨테이너의 너비와 높이
     */
    getContainerDimensions(): { width: number; height: number };

    /**
     * 렌더링 설정을 가져옵니다.
     * @returns 렌더링 설정
     */
    getRenderConfig(): IRenderConfig;

    /**
     * 카드 스타일을 가져옵니다.
     * @returns 카드 스타일
     */
    getCardStyle(): ICardStyle;
} 