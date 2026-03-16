/**
 * Replaces {{field}} placeholders in a template string with values from data.
 * Supports nested keys: {{user.name}} → data.user.name
 */
export function interpolate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, keyPath: string) => {
    const value = keyPath
      .split('.')
      .reduce<unknown>((obj, key) => {
        if (obj !== null && typeof obj === 'object') {
          return (obj as Record<string, unknown>)[key];
        }
        return undefined;
      }, data);

    return value !== undefined && value !== null ? String(value) : `{{${keyPath}}}`;
  });
}
