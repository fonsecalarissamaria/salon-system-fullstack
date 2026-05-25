import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente';
import { AgendamentoService } from '../../services/agendamento';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
})
export class PerfilComponent {
  perfilAberto = false;

  aba: 'dados' | 'agendamentos' = 'dados';

  cpfBusca = '';

  cliente: any = {
    endereco: {},
  };
  agendamentos: any[] = [];

  constructor(
    private clienteService: ClienteService,
    private agendamentoService: AgendamentoService,
  ) {}

  buscarCliente() {
    const cpfLimpo = this.cpfBusca.replace(/\D/g, '');

    this.clienteService.buscarPorCpf(cpfLimpo).subscribe({
      next: (data) => {
        this.cliente = data;
        this.perfilAberto = true;
        this.buscarAgendamentos(this.cliente.id);
      },
      error: () => {
        alert('Cliente não encontrado');
        this.perfilAberto = false;
      },
    });
  }

  mudarAba(aba: string) {
    this.aba = aba as any;
  }

  salvar() {
    const payload: any = {
      id: this.cliente.id,
      nome: this.cliente.nome,
      email: this.cliente.email,
      cpf: this.cliente.cpf,
      telefone: this.cliente.telefone,
      endereco: {
        cep: this.cliente.endereco?.cep,
        logradouro: this.cliente.endereco?.logradouro,
        numero: this.cliente.endereco?.numero,
        complemento: this.cliente.endereco?.complemento,
        bairro: this.cliente.endereco?.bairro,
        cidade: this.cliente.endereco?.cidade,
        uf: this.cliente.endereco?.uf,
      },
    };

    this.clienteService.atualizar(payload).subscribe({
      next: () => alert('Dados atualizados com sucesso!'),
      error: (err) => {
        console.error(err);
        alert('Erro ao atualizar dados');
      },
    });
  }

  buscarAgendamentos(clienteId: number) {
    this.agendamentoService.listarPorCliente(clienteId).subscribe({
      next: (res) => {
        this.agendamentos = res;
      },
      error: (err) => {
        console.error('Erro ao buscar agendamentos:', err);
      },
    });
  }

  editarAgendamento(agendamento: any) {
    const payload = {
      cpf: this.cliente.cpf,
      data: new Date(agendamento.data).toISOString().slice(0, 19),
      servicos: agendamento.servicos,
    };

    this.agendamentoService.atualizar(agendamento.id, payload).subscribe({
      next: (mensagemDoJava) => {
        // Exibe exatamente o texto que veio lá de dentro do Controller
        alert(mensagemDoJava);
        this.buscarAgendamentos(this.cliente.id);
      },
      error: (err) => {
        console.error('Erro de rede ou servidor fora do ar:', err);
        alert('Ocorreu um erro de comunicação com o servidor.');
      },
    });
  }

  cancelarAgendamento(agendamentoId: number) {
    if (confirm('Deseja realmente cancelar este agendamento?')) {
      this.agendamentoService.cancelarCliente(agendamentoId).subscribe({
        next: () => {
          alert('Agendamento cancelado com sucesso!');
          this.buscarAgendamentos(this.cliente.id);
        },
        error: (err) => {
          console.error(err);
          // Caso a regra de 48h do @PatchMapping barra o cancelamento
          alert(
            'Não foi possível cancelar: Alterações ou cancelamentos só são permitidos com até 2 dias de antecedência. Por favor, entre em contato com o salão.',
          );
        },
      });
    }
  }

  aceitarPropostaHorario(agendamentoId: number) {
    this.agendamentoService.confirmar(agendamentoId).subscribe({
      next: () => {
        alert('Você confirmou o novo horário com sucesso! Te esperamos lá.');
        this.buscarAgendamentos(this.cliente.id); // Recarrega a lista
      },
      error: () =>
        alert('Erro ao confirmar horário. Por favor, tente novamente ou ligue no salão.'),
    });
  }
}
