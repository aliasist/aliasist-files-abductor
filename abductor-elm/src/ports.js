// Bridges Elm's ports (see Main.elm) to the Tauri APIs. Elm has no direct
// access to JS/window APIs by design, so every Tauri call funnels through
// here and back into the app via a port subscription.
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";

export function wirePorts(app) {
  app.ports.requestDlDir.subscribe(() => {
    invoke("get_dl_dir").then((dir) => app.ports.gotDlDir.send(dir));
  });

  app.ports.browseFolder.subscribe(() => {
    open({ directory: true, multiple: false }).then((dir) => {
      app.ports.folderSelected.send(typeof dir === "string" ? dir : "");
    });
  });

  app.ports.startDownload.subscribe(({ url, savePath }) => {
    invoke("download_file", { url, savePath })
      .then((result) => {
        app.ports.downloadResult.send(result);
      })
      .catch((err) => {
        app.ports.downloadResult.send({
          success: false,
          final_path: null,
          error: typeof err === "string" ? err : JSON.stringify(err),
        });
      });
  });

  app.ports.abortDownload.subscribe(() => {
    invoke("abort_download");
  });

  listen("download://progress", (event) => {
    app.ports.downloadProgress.send(event.payload);
  });
}
