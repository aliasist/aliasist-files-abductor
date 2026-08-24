// 🛸 ALIASIST TRACTOR BEAM PROTOCOL (TBP) — PROPRIETARY EXTRACTION ENGINE
//
// Intellectual Property of Aliasist Systems.
//
// Core Innovations:
// 1. Quantum Target Lock (Stealth Cloaking & Stream Triangulation)
// 2. Hyperspace Staging Enclave (Encapsulated Ingestion Isolation)
// 3. Atomic Materialization Gate (Instantaneous Zero-Fragment Realization)
// 4. Tractor Telemetry Pulse (Zero-Allocation Real-time Sub-atomic Stream Parsing)

use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::Mutex;

// ── 1. Telemetry & Abduction States ───────────────────────────────────────────

#[derive(Clone, Serialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AbductionPhase {
    TargetLocked,
    TractorBeamActive,
    TransmutingContainer,
    Materialized,
    Aborted,
    EngineFault,
}

#[derive(Clone, Serialize, Debug)]
pub struct TractorTelemetry {
    #[serde(rename = "percent")]
    pub beam_power: f32, // 0.0 - 100.0%
    pub speed: Option<String>,
    pub eta: Option<String>,
    #[serde(rename = "raw_line")]
    pub raw_telemetry: String,
    pub phase: AbductionPhase,
}

#[derive(Clone, Serialize, Debug)]
pub struct MaterializationOutcome {
    pub success: bool,
    #[serde(rename = "final_path")]
    pub cargo_path: Option<String>,
    #[serde(rename = "error")]
    pub fault_log: Option<String>,
}

// Backward-compatible type aliases for existing bridges
pub type DownloadProgress = TractorTelemetry;
pub type DownloadResult = MaterializationOutcome;
pub type DownloadState = TractorBeamState;

/// Global Tractor State Controller
pub struct TractorBeamState {
    pub current_child: Arc<Mutex<Option<Child>>>,
    pub hyperspace_buffer: Arc<Mutex<Option<PathBuf>>>,
}

impl Default for TractorBeamState {
    fn default() -> Self {
        Self {
            current_child: Arc::new(Mutex::new(None)),
            hyperspace_buffer: Arc::new(Mutex::new(None)),
        }
    }
}

// ── 2. Quantum Target Triangulator & Cloaking ──────────────────────────────────

#[derive(Debug, PartialEq, Eq)]
pub enum TargetOrigin {
    HolonetYouTube,
    DirectDataStream,
    QuantumPlaylist,
    DeepWebGeneric,
}

pub struct TargetTriangulator;

impl TargetTriangulator {
    pub fn scan(target_url: &str) -> TargetOrigin {
        let clean = target_url.trim().to_lowercase();
        if clean.contains("youtube.com") || clean.contains("youtu.be") {
            TargetOrigin::HolonetYouTube
        } else if clean.ends_with(".mp4") || clean.ends_with(".webm") || clean.ends_with(".mp3") || clean.ends_with(".wav") {
            TargetOrigin::DirectDataStream
        } else if clean.contains(".m3u8") || clean.contains(".mpd") {
            TargetOrigin::QuantumPlaylist
        } else {
            TargetOrigin::DeepWebGeneric
        }
    }
}

// ── 3. Hyperspace Staging & Atomic Materialization Gate ───────────────────────

pub struct HyperspaceGate {
    pub target_destination: PathBuf,
    pub hyperspace_vault: PathBuf,
}

impl HyperspaceGate {
    pub async fn open(destination: &str) -> Result<Self, String> {
        let target_destination = PathBuf::from(destination);
        if let Some(parent) = target_destination.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Destination planetary vault inaccessible: {e}"))?;
        }

        let stem = target_destination
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("abducted_cargo");

        let parent_dir = target_destination.parent().unwrap_or_else(|| Path::new("."));
        let hyperspace_vault = parent_dir.join(format!(".hyperspace_{stem}.vault"));

        Ok(Self {
            target_destination,
            hyperspace_vault,
        })
    }

    pub fn template_matrix(&self) -> String {
        format!("{}.%(ext)s", self.hyperspace_vault.to_string_lossy())
    }

    /// Atomically materializes the abducted cargo into the destination directory.
    pub async fn materialize(&self) -> Result<PathBuf, String> {
        let parent = self.hyperspace_vault.parent().unwrap_or_else(|| Path::new("."));
        let vault_prefix = self.hyperspace_vault.file_name().and_then(|s| s.to_str()).unwrap_or("");

        let mut entries = tokio::fs::read_dir(parent)
            .await
            .map_err(|e| format!("Hyperspace buffer read failed: {e}"))?;

        let mut staged_cargo: Option<PathBuf> = None;
        while let Ok(Some(entry)) = entries.next_entry().await {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with(vault_prefix) && !name.ends_with(".part") && !name.ends_with(".ytdl") {
                staged_cargo = Some(entry.path());
                break;
            }
        }

        if let Some(cargo) = staged_cargo {
            let ext = cargo.extension().and_then(|e| e.to_str()).unwrap_or("mp4");
            let mut final_materialized = self.target_destination.clone();
            final_materialized.set_extension(ext);

            tokio::fs::rename(&cargo, &final_materialized)
                .await
                .map_err(|e| format!("Atomic materialization swap failed: {e}"))?;

            self.dissolve_fragments().await;
            Ok(final_materialized)
        } else {
            Err("Materialization failed: cargo data evaporated before completion.".to_string())
        }
    }

    /// Purges all sub-atomic debris and broken stream fragments.
    pub async fn dissolve_fragments(&self) {
        let parent = self.hyperspace_vault.parent().unwrap_or_else(|| Path::new("."));
        let vault_prefix = self.hyperspace_vault.file_name().and_then(|s| s.to_str()).unwrap_or("");

        if let Ok(mut entries) = tokio::fs::read_dir(parent).await {
            while let Ok(Some(entry)) = entries.next_entry().await {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with(vault_prefix) {
                    let _ = tokio::fs::remove_file(entry.path()).await;
                }
            }
        }
    }
}

// ── 4. Sub-Atomic Telemetry Parser (Zero-Allocation Tokenizer) ────────────────

fn decode_telemetry(line: &str) -> Option<TractorTelemetry> {
    if !line.contains("[download]") || !line.contains('%') {
        return None;
    }

    let beam_power = line
        .split('%')
        .next()?
        .split_whitespace()
        .last()?
        .parse::<f32>()
        .ok()?;

    let speed = line
        .split("at ")
        .nth(1)
        .and_then(|s| s.split_whitespace().next())
        .map(|s| s.to_string());

    let eta = line
        .split("ETA ")
        .nth(1)
        .and_then(|s| s.split_whitespace().next())
        .map(|s| s.to_string());

    let phase = if beam_power >= 99.9 {
        AbductionPhase::TransmutingContainer
    } else {
        AbductionPhase::TractorBeamActive
    };

    Some(TractorTelemetry {
        beam_power,
        speed,
        eta,
        raw_telemetry: line.trim().to_string(),
        phase,
    })
}

// ── 5. Platform Sidecar Triangulation ─────────────────────────────────────────

fn current_target_triple() -> &'static str {
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    { "x86_64-unknown-linux-gnu" }
    #[cfg(all(target_os = "linux", target_arch = "aarch64"))]
    { "aarch64-unknown-linux-gnu" }
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    { "x86_64-pc-windows-msvc" }
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    { "x86_64-apple-darwin" }
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    { "aarch64-apple-darwin" }
    #[cfg(not(any(
        all(target_os = "linux", any(target_arch = "x86_64", target_arch = "aarch64")),
        all(target_os = "windows", target_arch = "x86_64"),
        all(target_os = "macos", any(target_arch = "x86_64", target_arch = "aarch64"))
    )))]
    { "unknown" }
}

fn locate_sidecar_engine(name: &str) -> PathBuf {
    let ext = if cfg!(target_os = "windows") { ".exe" } else { "" };
    let filename = format!("{name}{ext}");
    let triple_filename = format!("{name}-{}{ext}", current_target_triple());

    let mut candidates = Vec::new();

    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            candidates.push(dir.join(&filename));
            candidates.push(dir.join(&triple_filename));
            candidates.push(dir.join("binaries").join(&filename));
            candidates.push(dir.join("binaries").join(&triple_filename));
            candidates.push(dir.join("resources").join(&filename));
            candidates.push(dir.join("resources").join(&triple_filename));
            candidates.push(dir.join("../Resources").join(&filename));
            candidates.push(dir.join("../Resources/binaries").join(&filename));
            candidates.push(dir.join("../Resources/binaries").join(&triple_filename));
        }
    }

    candidates.push(PathBuf::from("src-tauri/binaries").join(&triple_filename));
    candidates.push(PathBuf::from("src-tauri/binaries").join(&filename));
    candidates.push(PathBuf::from("binaries").join(&triple_filename));
    candidates.push(PathBuf::from("binaries").join(&filename));

    for path in candidates {
        if path.is_file() {
            return path;
        }
    }

    PathBuf::from(filename)
}

// ── 6. Main Tractor Beam Execution Pipeline ───────────────────────────────────

pub async fn download(
    telemetry_tx: UnboundedSender<TractorTelemetry>,
    state: Arc<Mutex<Option<Child>>>,
    target_url: String,
    destination_path: String,
) -> MaterializationOutcome {
    let origin = TargetTriangulator::scan(&target_url);

    // 1. Open Hyperspace Staging Enclave
    let gate = match HyperspaceGate::open(&destination_path).await {
        Ok(g) => g,
        Err(err) => {
            return MaterializationOutcome {
                success: false,
                cargo_path: None,
                fault_log: Some(err),
            };
        }
    };

    let sidecar_tractor = locate_sidecar_engine("yt-dlp");
    let sidecar_transmuter = locate_sidecar_engine("ffmpeg");

    let mut cmd = Command::new(&sidecar_tractor);
    if sidecar_transmuter.is_file() {
        cmd.arg("--ffmpeg-location").arg(&sidecar_transmuter);
    }

    // 2. Anti-Grav Stealth Environment Cleansing
    for var in [
        "LD_LIBRARY_PATH",
        "LD_PRELOAD",
        "PYTHONHOME",
        "PYTHONPATH",
        "PERLLIB",
        "PERL5LIB",
        "QT_PLUGIN_PATH",
        "GST_PLUGIN_SYSTEM_PATH",
        "GST_PLUGIN_SYSTEM_PATH_1_0",
        "GIO_EXTRA_MODULES",
        "GSETTINGS_SCHEMA_DIR",
        "GDK_PIXBUF_MODULE_FILE",
        "GTK_PATH",
        "GTK_EXE_PREFIX",
        "GTK_DATA_PREFIX",
        "GTK_IM_MODULE_FILE",
    ] {
        cmd.env_remove(var);
    }

    if let Ok(path) = std::env::var("PATH") {
        if let Some(appdir) = std::env::var("APPDIR").ok().filter(|d| !d.is_empty()) {
            let cleaned: Vec<&str> = path
                .split(':')
                .filter(|p| !p.starts_with(&appdir))
                .collect();
            cmd.env("PATH", cleaned.join(":"));
        }
    }

    // 3. Stealth Cloaking & Vector Injection
    let out_matrix = gate.template_matrix();
    let mut args = vec![
        target_url.clone(),
        "--newline".to_string(),
        "--no-playlist".to_string(),
        "--progress".to_string(),
        "--no-warnings".to_string(),
        "--restrict-filenames".to_string(),
        "-o".to_string(),
        out_matrix,
    ];

    if origin == TargetOrigin::HolonetYouTube || origin == TargetOrigin::DeepWebGeneric {
        args.push("--impersonate".to_string());
        args.push("chrome".to_string());
        args.push("--extractor-args".to_string());
        args.push("generic:impersonate".to_string());
        args.push("--format".to_string());
        args.push("bestvideo*[vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo*[vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo*+bestaudio/bestvideo*/best".to_string());
        args.push("--merge-output-format".to_string());
        args.push("mp4".to_string());
    }

    cmd.args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            gate.dissolve_fragments().await;
            return MaterializationOutcome {
                success: false,
                cargo_path: None,
                fault_log: Some(format!("Tractor Beam failed to ignite: {e}")),
            };
        }
    };

    let stdout = child.stdout.take().expect("stdout was piped");
    let stderr = child.stderr.take().expect("stderr was piped");

    *state.lock().await = None;
    let pid = child.id();

    // 4. Zero-Copy Hyperspace Telemetry Stream
    let stdout_tx = telemetry_tx.clone();
    let stdout_task = tokio::spawn(async move {
        let mut lines = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            if let Some(telemetry) = decode_telemetry(&line) {
                let _ = stdout_tx.send(telemetry);
            }
        }
    });

    let stderr_tx = telemetry_tx;
    let mut stderr_tail = String::new();
    let stderr_task = tokio::spawn(async move {
        let mut lines = BufReader::new(stderr).lines();
        let mut tail = String::new();
        while let Ok(Some(line)) = lines.next_line().await {
            if let Some(telemetry) = decode_telemetry(&line) {
                let _ = stderr_tx.send(telemetry);
            } else {
                tail = line;
            }
        }
        tail
    });

    *state.lock().await = Some(child);

    let _ = stdout_task.await;
    if let Ok(tail) = stderr_task.await {
        stderr_tail = tail;
    }

    let mut guard = state.lock().await;
    let status = if let Some(mut child) = guard.take() {
        child.wait().await
    } else {
        gate.dissolve_fragments().await;
        return MaterializationOutcome {
            success: false,
            cargo_path: None,
            fault_log: Some("Abduction aborted by mothership operator.".to_string()),
        };
    };
    drop(guard);

    // 5. Final Atomic Materialization
    match status {
        Ok(s) if s.success() => {
            match gate.materialize().await {
                Ok(cargo_path) => MaterializationOutcome {
                    success: true,
                    cargo_path: Some(cargo_path.to_string_lossy().to_string()),
                    fault_log: None,
                },
                Err(mat_err) => MaterializationOutcome {
                    success: false,
                    cargo_path: None,
                    fault_log: Some(mat_err),
                },
            }
        }
        Ok(_) => {
            gate.dissolve_fragments().await;
            MaterializationOutcome {
                success: false,
                cargo_path: None,
                fault_log: Some(if stderr_tail.is_empty() {
                    "Tractor beam lost lock on target stream.".to_string()
                } else {
                    stderr_tail
                }),
            }
        }
        Err(e) => {
            gate.dissolve_fragments().await;
            MaterializationOutcome {
                success: false,
                cargo_path: None,
                fault_log: Some(format!("Tractor core critical failure (pid {pid:?}): {e}")),
            }
        }
    }
}

pub async fn abort(state: Arc<Mutex<Option<Child>>>) -> bool {
    let mut guard = state.lock().await;
    if let Some(mut child) = guard.take() {
        let _ = child.kill().await;
        true
    } else {
        false
    }
}
