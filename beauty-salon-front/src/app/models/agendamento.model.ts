export interface Agendamento {
  id?: number;
  cpf: string;
  data: string; // Formato ISO ou string do datetime-local
  servicos: string;
}
