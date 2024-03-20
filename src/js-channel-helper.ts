export type ChannelType =
  | "FlutterChannelReady"
  | "AnnotationChannel"
  | "ResetCameraChannel";
export const postJSMessage = (channel: ChannelType, message: any) => {
  if (channel in window) {
    (window[channel] as JavaScriptChannel).postMessage(message);
  }
};

declare global {
  interface Window {
    FlutterChannelReady: JavaScriptChannel;
    AnnotationChannel: JavaScriptChannel;
    ResetCameraChannel: JavaScriptChannel;
    flutter_inappwebview: {
      callHandler: any;
    };
  }
  interface JavaScriptChannel {
    postMessage: (message: any) => void;
  }
}

export type JSCaller = "onModelLoaded" | "onModelError";

export const callFlutterHandler = (handler: string, args?: any) => {
  if (window.flutter_inappwebview) {
    window.flutter_inappwebview.callHandler(handler, args);
  }
};
