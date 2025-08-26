declare module '@toast-ui/editor' {
  export interface EditorOptions {
    el: HTMLElement;
    height?: string;
    initialEditType?: 'markdown' | 'wysiwyg';
    previewStyle?: 'tab' | 'vertical';
    initialValue?: string;
    usageStatistics:boolean;
    theme:string;
  }

  export default class Editor {
    constructor(options: EditorOptions);
    getMarkdown(): string;
    getHTML(): string;
  }
}