/*
 * Service Worker 脚本：在浏览器后台运行，用于在用户离线时仍能加载已缓存的页面和资源
 * 本文件由浏览器独立执行，与网页页面的 JavaScript 相互隔离
 */

/* 定义缓存的名称，用于在浏览器中区分不同的缓存区域，修改版本号可强制更新缓存 */
var CACHE_NAME = "daily-art-v1";

/* 定义需要在安装阶段预先存入缓存的文件路径列表 */
/* 使用相对于网站根目录的路径，浏览器会向当前域名发起请求并缓存响应结果 */
var CACHE_URLS = [
  "/",           /* 网站根路径，通常返回首页内容 */
  "index.html",  /* 主页面文件 */
  "manifest.json" /* PWA 配置清单文件 */
];

/*
 * 监听 install 事件：当浏览器首次加载此 Service Worker 或 Service Worker 发生更新时触发
 * 在此阶段将指定文件预先存入本地缓存区
 */
self.addEventListener("install", function (event) {
  /*
   * event.waitUntil 告知浏览器：在内部的异步操作完成之前，不要认为 install 事件已结束
   * 若未调用 waitUntil，浏览器可能在缓存尚未完成时就将 Service Worker 标记为已安装
   */
  event.waitUntil(
    /*
     * caches.open 打开指定名称的缓存区，若不存在则新建一个
     * 返回一个 Promise，成功时会得到代表该缓存区的 cache 对象
     */
    caches.open(CACHE_NAME).then(function (cache) {
      /*
       * cache.addAll 依次请求列表中的每个地址，并将每个请求的响应结果写入当前缓存区
       * 若其中任一请求失败，整个 addAll 会失败，install 事件也会失败
       * 返回 Promise，全部成功时 resolve
       */
      return cache.addAll(CACHE_URLS);
    })
  );
});

/*
 * 监听 fetch 事件：当页面或页面内的资源（如脚本、图片）发起任何网络请求时触发
 * 在此阶段可以决定：从网络获取响应，或从本地缓存中读取已保存的响应
 */
self.addEventListener("fetch", function (event) {
  /*
   * event.respondWith 用于接管该请求的响应过程
   * 必须传入一个 Promise，该 Promise 最终 resolve 为一个 Response 对象，作为本次请求的返回结果
   */
  event.respondWith(
    /*
     * 采用“网络优先，缓存兜底”策略：
     * 先尝试从网络获取最新数据，若网络不可用或请求失败，再从本地缓存中读取
     */
    fetch(event.request)
      .then(function (response) {
        /*
         * 网络请求成功：直接返回该响应给页面
         * 注意：此处不将响应写入缓存，保持“网络优先”的语义，仅在网络失败时使用缓存
         */
        return response;
      })
      .catch(function () {
        /*
         * 网络请求失败（例如断网、超时、服务器无响应）：从本地缓存中查找是否有该请求的已缓存响应
         * caches.match 在任意已存在的缓存区中查找与 event.request 匹配的缓存条目
         * 若找到则返回对应的 Response，若未找到则返回 undefined
         */
        return caches.match(event.request);
      })
  );
});
