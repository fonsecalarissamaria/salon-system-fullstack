export interface Endereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
}

export interface Cliente {
  id?: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  endereco: Endereco;
}
