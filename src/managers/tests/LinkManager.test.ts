import { LinkManager } from "../LinkManager";

describe("LinkManager", () => {
  let linkManager: LinkManager;

  beforeEach(() => {
    linkManager = new LinkManager();
  });

  describe("isYouTubeIframeVideo", () => {
    it("should return false for non-iframe elements", () => {
      const div = document.createElement("div");
      expect(linkManager.isYouTubeIframeVideo(div)).toBeFalsy();
    });

    it("should return false for iframes without YouTube URLs", () => {
      const iframe = document.createElement("iframe");
      iframe.src = "https://vimeo.com/video/123456";
      expect(linkManager.isYouTubeIframeVideo(iframe)).toBeFalsy();
    });

    it("should return true for iframes with youtube.com/embed/ URLs", () => {
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/dQw4w9WgXcQ";
      expect(linkManager.isYouTubeIframeVideo(iframe)).toBeTruthy();
    });

    it("should return true for iframes with youtu.be/ URLs", () => {
      const iframe = document.createElement("iframe");
      iframe.src = "https://youtu.be/dQw4w9WgXcQ";
      expect(linkManager.isYouTubeIframeVideo(iframe)).toBeTruthy();
    });
  });
});
