/**
 * CatalogItem — domínio read-only.
 * Usado para provar um módulo de *leitura estruturada*.
 */
export interface CatalogItemProps {
  id: string
  sku: string
  name: string
  description: string
  category: string
  priceCents: number
  createdAt: Date
}

export class CatalogItem {
  private constructor(private props: CatalogItemProps) {}

  static hydrate(props: CatalogItemProps): CatalogItem {
    return new CatalogItem(props)
  }

  toJSON(): CatalogItemProps {
    return { ...this.props }
  }

  /** Regra de apresentação pura: preço formatado. */
  get priceFormatted(): string {
    return (this.props.priceCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  get id() { return this.props.id }
  get sku() { return this.props.sku }
  get name() { return this.props.name }
  get description() { return this.props.description }
  get category() { return this.props.category }
  get priceCents() { return this.props.priceCents }
  get createdAt() { return this.props.createdAt }
}
