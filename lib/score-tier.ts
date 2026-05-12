export type ScoreTier = {
  label: string;
  emoji: string;
  color: string;
  message: string;
};

export function getScoreTier(score: number): ScoreTier {
  if (score >= 85) {
    return {
      label: "CEO Material",
      emoji: "\uD83C\uDFC6",
      color: "emerald",
      message: "CV kamu sangat kuat. Kemungkinan besar lolos screening pertama.",
    };
  }
  if (score >= 70) {
    return {
      label: "Survivor",
      emoji: "\u2705",
      color: "green",
      message: "CV kamu cukup baik, tapi masih ada beberapa hal yang bisa diperkuat.",
    };
  }
  if (score >= 50) {
    return {
      label: "On The Edge",
      emoji: "\u26A0\uFE0F",
      color: "yellow",
      message: "CV kamu bisa lolos, tapi bersaing tipis. Perbaiki quick wins dulu.",
    };
  }
  if (score >= 30) {
    return {
      label: "Intern-Level",
      emoji: "\uD83D\uDCCB",
      color: "orange",
      message: "Banyak hal fundamental yang perlu diperbaiki sebelum apply.",
    };
  }
  return {
    label: "Instant Reject",
    emoji: "\uD83D\uDDD1\uFE0F",
    color: "red",
    message: "CV ini tidak akan bertahan 7 detik di tangan HRD. Mulai dari awal.",
  };
}
