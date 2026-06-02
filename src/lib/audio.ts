import { AudioPlayer, createAudioPlayer } from "expo-audio";
import { GameSettings } from "@/lib/game-settings";

let musicPlayer: AudioPlayer | null = null;
let isMusicPlaying = false;

const players: Record<string, AudioPlayer | null> = {
  correct: null,
  wrong: null,
  reveal: null,
  hint: null,
  tap: null,

  coin: null,
  reward: null,
  levelup: null,
  lootbox: null,
};

function makePlayer(asset: any) {
  return createAudioPlayer(asset);
}

async function ensureAudioLoaded() {
  await loadGameAudio();
}

export async function loadGameAudio() {
  if (!players.correct) {
    players.correct = makePlayer(
      require("../../assets/sounds/correct.mp3")
    );

    players.wrong = makePlayer(
      require("../../assets/sounds/wrong.mp3")
    );

    players.reveal = makePlayer(
      require("../../assets/sounds/reveal.mp3")
    );

    players.hint = makePlayer(
      require("../../assets/sounds/hint.mp3")
    );

    players.tap = makePlayer(
      require("../../assets/sounds/tap.mp3")
    );

    players.coin = makePlayer(
      require("../../assets/sounds/coin.mp3")
    );

    players.reward = makePlayer(
      require("../../assets/sounds/reward.mp3")
    );

    players.levelup = makePlayer(
      require("../../assets/sounds/levelup.mp3")
    );

    players.lootbox = makePlayer(
      require("../../assets/sounds/lootbox.mp3")
    );
  }

  if (!musicPlayer) {
    musicPlayer = makePlayer(
      require("../../assets/sounds/cozy_loop.mp3")
    );

    musicPlayer.loop = true;
  }
}

export async function playSfx(
  name: keyof typeof players,
  settings?: GameSettings | null
) {
  await ensureAudioLoaded();

  if (settings && !settings.sfxEnabled) return;

  const player = players[name];

  if (!player) return;

  player.volume = settings?.sfxVolume ?? 1;

  player.seekTo(0);

  player.play();
}

export async function startMusic(
  settings: GameSettings
) {
  await ensureAudioLoaded();

  if (!musicPlayer) return;

  musicPlayer.volume = settings.musicVolume;

  if (settings.musicEnabled && !isMusicPlaying) {
    musicPlayer.play();
    isMusicPlaying = true;
  }
}

export async function stopMusic() {
  if (!musicPlayer) return;

  musicPlayer.pause();
  isMusicPlaying = false;
}

export async function updateMusic(
  settings: GameSettings
) {
  await ensureAudioLoaded();

  if (!musicPlayer) return;

  musicPlayer.volume = settings.musicVolume;

  if (settings.musicEnabled) {
    if (!isMusicPlaying) {
      musicPlayer.play();
      isMusicPlaying = true;
    }
  } else {
    musicPlayer.pause();
    isMusicPlaying = false;
  }
}
