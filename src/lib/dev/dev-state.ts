let isDeveloperModeEnabled = false;

export function getIsDeveloperModeEnabled(): boolean {
  return isDeveloperModeEnabled;
}

export function setIsDeveloperModeEnabledState(value: boolean): void {
  isDeveloperModeEnabled = value;
}

export function clearDevRuntimeState(): void {
  isDeveloperModeEnabled = false;
}
