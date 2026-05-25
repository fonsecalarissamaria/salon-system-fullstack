import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente';
import { AgendamentoService } from '../../services/agendamento';

@Component({
  selector: 'app-painel-gestao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './painel-gestao.component.html',
  styleUrls: ['./painel-gestao.component.css'],
})
export class PainelGestaoComponent implements OnInit {
  aba: 'desempenho' | 'agenda' | 'clientes' = 'desempenho';

  // Controle de Paginação
  paginaClientes = 0;
  paginaPendentes = 0;
  totalPaginasClientes = 0;
  totalPaginasPendentes = 0;

  // Dados das Listas
  clientes: any[] = [];
  agendamentosPendentes: any[] = [];
  historicoFiltrado: any[] = [];
  historicoConfirmados: any[] = [];
  historicoCancelados: any[] = [];
  historicoFinalizados: any[] = [];

  //  gatilho: indica se a busca já foi executada pelo menos uma vez
  pesquisaRealizada = false;

  // Filtros de Data
  filtroInicio = '';
  filtroFim = '';
  textoPeriodo = 'Calculando período...';

  // Estatísticas da Semana
  totalSemana = 0;
  totalConfirmados = 0;
  totalPendentes = 0;

  constructor(
    private clienteService: ClienteService,
    private agendamentoService: AgendamentoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (sessionStorage.getItem('leilaLogada') !== 'sim') {
      alert('Sua sessão expirou ou você não fez login.');
      this.router.navigate(['/login']);
      return;
    }

    this.configurarFiltroHoje();
    this.carregarDesempenhoSemanal();
    this.carregarPendentes();
    this.carregarClientes();
    this.filtrarAgendamentosSilencioso();
  }

  mudarAba(novaAba: 'desempenho' | 'agenda' | 'clientes'): void {
    this.aba = novaAba;
  }

  configurarFiltroHoje(): void {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    this.filtroInicio = `${ano}-${mes}-${dia}T00:00`;
    this.filtroFim = `${ano}-${mes}-${dia}T23:59`;
  }

  carregarClientes(): void {
    this.clienteService.listarPaginado(this.paginaClientes).subscribe({
      next: (data) => {
        this.clientes = data.content;
        this.totalPaginasClientes = data.totalPages;
      },
      error: (err) => console.error('Erro ao listar clientes:', err),
    });
  }

  excluirCliente(id: string): void {
    if (confirm('Tem certeza que deseja excluir este cadastro?')) {
      this.clienteService.excluir(id).subscribe({
        next: () => {
          alert('Cliente excluído.');
          this.carregarClientes();
        },
        error: (err) => console.error('Erro ao excluir:', err),
      });
    }
  }

  mudarPaginaClientes(direcao: 'anterior' | 'proxima'): void {
    if (direcao === 'proxima' && this.paginaClientes < this.totalPaginasClientes - 1) {
      this.paginaClientes++;
      this.carregarClientes();
    } else if (direcao === 'anterior' && this.paginaClientes > 0) {
      this.paginaClientes--;
      this.carregarClientes();
    }
  }

  carregarPendentes(): void {
    this.agendamentoService.listarPendentes(this.paginaPendentes).subscribe({
      next: (data) => {
        this.agendamentosPendentes = data.content;
        this.totalPaginasPendentes = data.totalPages;
        this.totalPendentes = data.totalElements;
      },
      error: (err) => console.error('Erro ao carregar pendentes:', err),
    });
  }

  confirmarAgendamento(id: number): void {
    this.agendamentoService.confirmar(id).subscribe({
      next: () => {
        alert('Agendamento confirmado com sucesso!');
        this.carregarPendentes();
        this.carregarDesempenhoSemanal();
        this.filtrarAgendamentosSilencioso();
      },
      error: (err) => {
        // Trata o conflito controlado (HTTP 409) gerado pelo backend
        if (err.status === 409 && err.error?.error === 'CONFLITO') {
          const sugestoes: string[] = err.error.sugestoes;

          if (sugestoes && sugestoes.length > 0) {
            //  DINÂMICO: Formata exibindo a Data E a Hora de cada opção de contraproposta
            const opcoesTexto = sugestoes
              .map((s, index) => {
                const dataObj = new Date(s);
                const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                return `${index + 1} - Dia ${dataFormatada} às ${horaFormatada}h`;
              })
              .join('\n');

            const resposta = prompt(
              `${err.error.message}\n\nSelecione um horário livre para enviar uma contraproposta:\n${opcoesTexto}\n\nDigite o número da opção para mover o agendamento (ficará PENDENTE aguardando aprovação da cliente), ou cancele para não alterar:`
            );

            const opcaoSelecionada = parseInt(resposta || '', 10);
            if (
              !isNaN(opcaoSelecionada) &&
              opcaoSelecionada >= 1 &&
              opcaoSelecionada <= sugestoes.length
            ) {
              const novoHorarioIso = sugestoes[opcaoSelecionada - 1];

              //  CHAMA O NOVO FLUXO: Altera o horário mas preserva o estado Pendente
              this.remanejarParaAprovacaoCliente(id, novoHorarioIso);
            }
          } else {
            alert('Este horário está ocupado e não foram encontradas vagas comerciais próximas disponíveis no sistema.');
          }
        } else {
          alert('Ocorreu um erro ao tentar confirmar este agendamento.');
        }
      },
    });
  }

  // metodo novo: atualiza a agenda com o novo horário mas mantêm como PENDENTE
  remanejarParaAprovacaoCliente(agendamentoId: number, novoHorario: string): void {
    this.agendamentoService.detalhar(agendamentoId).subscribe({
      next: (agendamentoAtual) => {

        // Monta o payload reinjetando os dados e aplicando a tag de Proposta nos serviços
        const payload = {
          cpf: agendamentoAtual.cliente?.cpf || '',
          data: novoHorario.substring(0, 19),
          servicos: `${agendamentoAtual.servicos} (Proposta de alteração pelo salão)`
        };

        // Atualiza via endpoint administrativo do Java
        this.agendamentoService.atualizarAdmin(agendamentoId, payload).subscribe({
          next: () => {
            alert('Agendamento realocado! O status continuará como PENDENTE. Lembre-se de avisar a cliente para que ela aprove o novo horário no painel dela.');
            this.carregarPendentes();
            this.carregarDesempenhoSemanal();
            this.filtrarAgendamentosSilencioso();
          },
          error: (err) => {
            console.error(err);
            alert('Erro ao atualizar o agendamento para a contraproposta.');
          }
        });
      },
      error: (err) => console.error('Erro ao detalhar agendamento atual:', err)
    });
  }

  mudarPaginaPendentes(direcao: 'anterior' | 'proxima'): void {
    if (direcao === 'proxima' && this.paginaPendentes < this.totalPaginasPendentes - 1) {
      this.paginaPendentes++;
      this.carregarPendentes();
    } else if (direcao === 'anterior' && this.paginaPendentes > 0) {
      this.paginaPendentes--;
      this.carregarPendentes();
    }
  }

  filtrarAgendamentos(): void {
    if (!this.filtroInicio || !this.filtroFim) {
      alert('Por favor, selecione a data de início e a data de fim para buscar.');
      return;
    }
    this.filtrarAgendamentosSilencioso();
  }

  filtrarAgendamentosSilencioso(): void {
    if (!this.filtroInicio || !this.filtroFim) return;

    this.agendamentoService.listarPorPeriodo(this.filtroInicio, this.filtroFim).subscribe({
      next: (data) => {
        this.historicoFiltrado = data;
        this.pesquisaRealizada = true;

        this.historicoConfirmados = data.filter((h) => h.status === 'CONFIRMADO');
        this.historicoCancelados = data.filter((h) => h.status === 'CANCELADO');
        this.historicoFinalizados = data.filter((h) => h.status === 'FINALIZADO');
      },
      error: (err) => {
        console.error('Erro ao carregar agendamentos:', err);
      },
    });
  }

  carregarDesempenhoSemanal(): void {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const diffSegunda = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);

    const segunda = new Date(hoje.setDate(diffSegunda));
    segunda.setHours(0, 0, 0, 0);

    const domingo = new Date(segunda.getTime());
    domingo.setDate(segunda.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    this.textoPeriodo = `Analisando a semana atual: ${segunda.toLocaleDateString('pt-BR')} até ${domingo.toLocaleDateString('pt-BR')}`;

    const inicioStr = segunda.toISOString().substring(0, 19);
    const fimStr = domingo.toISOString().substring(0, 19);

    this.agendamentoService.listarPorPeriodo(inicioStr, fimStr).subscribe({
      next: (data) => {
        this.totalConfirmados = data.filter((a) => a.status === 'CONFIRMADO').length;
        const totalPeriodo = data.length;

        this.agendamentoService.listarPendentes(0, 100).subscribe((dataPendente) => {
          const pendentesNoTotal = dataPendente.content.length;
          this.totalSemana = totalPeriodo + pendentesNoTotal;
          this.totalPendentes = pendentesNoTotal;
        });
      },
      error: (err) => console.error('Erro no desempenho:', err),
    });
  }

  formatarDataHora(dataString: string): { data: string; hora: string } {
    const dataObj = new Date(dataString);
    return {
      data: dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      hora: dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  sairDaGestao(): void {
    sessionStorage.removeItem('leilaLogada');
    this.router.navigate(['/']);
  }

  cancelarPorAdmin(id: number): void {
    if (confirm('Tem certeza que deseja cancelar (exclusão lógica) este agendamento?')) {
      this.agendamentoService.cancelarAdmin(id).subscribe({
        next: () => {
          alert('Agendamento cancelado pela administração.');
          this.carregarPendentes();
          this.carregarDesempenhoSemanal();
          this.filtrarAgendamentosSilencioso();
        },
        error: (err) => console.error('Erro ao cancelar agendamento:', err),
      });
    }
  }

  finalizarAgendamento(id: number): void {
    if (confirm('Deseja confirmar a finalização deste atendimento?')) {
      this.agendamentoService.finalizar(id).subscribe({
        next: () => {
          alert('Atendimento finalizado com sucesso!');
          this.carregarDesempenhoSemanal();
          this.filtrarAgendamentosSilencioso();
        },
        error: (err) => {
          console.error(err);
          alert('Erro ao finalizar o agendamento. Certifique-se de que ele já estava confirmado.');
        },
      });
    }
  }
}
