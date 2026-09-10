export type Pair = { key: number; value: number };
export type Config = {
  pairs: Pair[];
  query: number;
  retention: number;
  overlap: number;
  noise: number;
  strength: number;
  rule: "hebbian" | "delta";
  seed: number;
};
export type Step = {
  index: number;
  matrix: number[][];
  update: number[][];
  readout: number[];
  probabilities: number[];
  prediction: number | null;
  expected: number | null;
  correct: boolean | null;
  accuracy: number | null;
  norm: number;
  known_keys: number;
};
export type Result = {
  steps: Step[];
  query_vector: number[];
  keys: string[];
  values: string[];
  state_cells: number;
  state_bytes: number;
  token_cache_cells: number;
  reference: {
    prediction: number;
    probabilities: number[];
    attention: number[];
  };
  elapsed_ms: number;
  model_version: string;
  model_sha256: string;
  config: Config;
};
export type User = { id: number; name: string; email: string };
export type Saved = {
  id: number;
  name: string;
  config: Config;
  created_at: string;
};
export type Metrics = {
  name: string;
  version: string;
  seed: number;
  train_samples: number;
  test_samples: number;
  epochs: number;
  parameters: number;
  test_accuracy: number;
  noise_std: number;
  history: { epoch: number; loss: number }[];
  sha256: string;
  scope: string;
};
