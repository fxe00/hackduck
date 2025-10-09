declare const _default: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    visible: {
        type: BooleanConstructor;
    };
    position: {};
    selectedText: {};
    targetElement: {};
}>, (_ctx: any, _cache: any) => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("close" | "replaceText" | "addToHistory")[], "close" | "replaceText" | "addToHistory", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    visible: {
        type: BooleanConstructor;
    };
    position: {};
    selectedText: {};
    targetElement: {};
}>> & Readonly<{
    onClose?: (...args: any[]) => any;
    onReplaceText?: (...args: any[]) => any;
    onAddToHistory?: (...args: any[]) => any;
}>, {
    visible: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
