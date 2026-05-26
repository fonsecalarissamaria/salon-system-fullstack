import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendamentoService } from '../../services/agendamento';
import { ClienteService } from '../../services/cliente';
import { PainelGestaoComponent } from './painel-gestao.component';

describe('PainelGestaoComponent', () => {
  let component: PainelGestaoComponent;
  let fixture: ComponentFixture<PainelGestaoComponent>;
  let routerSpy: { navigate: any };

  // Mocks dos Serviços com estruturas de retorno padrão utilizando Observables do RxJS
  const mockClienteService = {
    listarPaginado: vi.fn().mockReturnValue(of({ content: [], totalPages: 0 })),
    excluir: vi.fn().mockReturnValue(of({})),
  };

  const mockAgendamentoService = {
    listarPendentes: vi.fn().mockReturnValue(of({ content: [], totalPages: 0, totalElements: 0 })),
    listarPorPeriodo: vi.fn().mockReturnValue(of([])),
    confirmar: vi.fn(),
    detalhar: vi.fn(),
    atualizarAdmin: vi.fn(),
    cancelarAdmin: vi.fn().mockReturnValue(of({})),
    finalizar: vi.fn().mockReturnValue(of({})),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock das janelas globais do navegador para evitar travamentos na esteira de testes
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(window, 'prompt').mockImplementation(() => null);

    routerSpy = { navigate: vi.fn() };

    // Cenário padrão: Simula que a Leila já efetuou o login
    sessionStorage.setItem('leilaLogada', 'sim');

    await TestBed.configureTestingModule({
      imports: [PainelGestaoComponent],
      providers: [
        { provide: ClienteService, useValue: mockClienteService },
        { provide: AgendamentoService, useValue: mockAgendamentoService },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelGestaoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges(); // Executa o ciclo do ngOnInit com login ativo
    expect(component).toBeTruthy();
  });

  it('deve barrar acesso e redirecionar para o login caso a sessão não exista', () => {
    sessionStorage.removeItem('leilaLogada'); // Rompe a credencial de segurança

    fixture.detectChanges(); // Executa o ngOnInit

    expect(window.alert).toHaveBeenCalledWith('Sua sessão expirou ou você não fez login.');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deve inicializar e segmentar as listas e estatísticas corretamente', () => {
    // Simula dados retornados pelo backend para a semana do painel
    const agendamentosFicticios = [
      { id: 1, status: 'CONFIRMADO' },
      { id: 2, status: 'CANCELADO' },
      { id: 3, status: 'FINALIZADO' },
    ];
    mockAgendamentoService.listarPorPeriodo.mockReturnValue(of(agendamentosFicticios));
    mockAgendamentoService.listarPendentes.mockReturnValue(
      of({ content: [{ id: 4 }], totalPages: 1, totalElements: 1 }),
    );

    fixture.detectChanges(); // Executa a carga inicial do ngOnInit

    expect(component.historicoConfirmados.length).toBe(1);
    expect(component.historicoCancelados.length).toBe(1);
    expect(component.historicoFinalizados.length).toBe(1);
    expect(component.totalPendentes).toBe(1);
  });

  it('deve processar o fluxo de contraproposta dinamicamente ao capturar um erro de Conflito HTTP 409', () => {
    fixture.detectChanges();

    // 1. Simula o erro de concorrência com o payload de sugestões calculado pelo Java
    const erroConflito = {
      status: 409,
      error: {
        error: 'CONFLITO',
        message: 'Este horário já está ocupado por outro atendimento confirmado.',
        sugestoes: ['2026-06-01T16:00:00', '2026-06-01T17:00:00'],
      },
    };
    mockAgendamentoService.confirmar.mockReturnValue(throwError(() => erroConflito));

    // 2. Simula que a Leila selecionou a Opção 1 no prompt do navegador ("1")
    vi.spyOn(window, 'prompt').mockReturnValue('1');

    // 3. Configura os retornos das chamadas do remanejo subsequente
    const agendamentoAtual = { id: 99, servicos: 'Progressiva', cliente: { cpf: '12345678901' } };
    mockAgendamentoService.detalhar.mockReturnValue(of(agendamentoAtual));
    mockAgendamentoService.atualizarAdmin.mockReturnValue(of({}));

    // Dispara a tentativa de confirmação que resultará no conflito
    component.confirmarAgendamento(99);

    // Validações do circuito de inteligência
    expect(window.prompt).toHaveBeenCalled();
    expect(mockAgendamentoService.detalhar).toHaveBeenCalledWith(99);
    expect(mockAgendamentoService.atualizarAdmin).toHaveBeenCalledWith(99, {
      cpf: '12345678901',
      data: '2026-06-01T16:00:00',
      servicos: 'Progressiva (Proposta de alteração pelo salão)',
    });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Agendamento realocado!'));
  });

  it('deve gerenciar a exclusão de clientes através de janelas de confirmação', () => {
    fixture.detectChanges();
    vi.spyOn(window, 'confirm').mockReturnValue(true); // Leila clicou em "Sim"

    component.excluirCliente('client_abc');

    expect(mockClienteService.excluir).toHaveBeenCalledWith('client_abc');
    expect(window.alert).toHaveBeenCalledWith('Cliente excluído.');
  });

  it('deve limpar os dados de sessão ao efetuar o logout', () => {
    fixture.detectChanges();

    component.sairDaGestao();

    expect(sessionStorage.getItem('leilaLogada')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});
