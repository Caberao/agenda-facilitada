export interface WorkspaceTabRequest {
  path: string;
  label: string;
}

export function requestWorkspaceTab(tab: WorkspaceTabRequest) {
  window.dispatchEvent(new CustomEvent<WorkspaceTabRequest>('workspace-open-tab', { detail: tab }));
}
