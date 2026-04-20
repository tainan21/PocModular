/**
 * Ponto único de entrada do domínio Notes.
 * Os módulos da UI e a infra só devem importar daqui.
 */
export * from "./domain/note"
export * from "./application/notes-repository"
export * from "./application/use-cases"
