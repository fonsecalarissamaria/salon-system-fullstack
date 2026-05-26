import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClienteService } from '../../services/cliente';
import { CadastroComponent } from './cadastro.component';

describe('CadastroComponent', () => {
  let component: CadastroComponent;
  let fixture: ComponentFixture<CadastroComponent>;

  // Criamos o mock para o ClienteService com os métodos que o componente usa
  const mockClienteService = {
    cadastrar: vi.fn(),
    atualizar: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Espiona e impede o 'alert' real de abrir na tela durante o teste automatizado
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [CadastroComponent],
      providers: [
        { provide: ClienteService, useValue: mockClienteService },
        // Fornece um mock mínimo para rotas, já que o componente usa RouterLink
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Dispara o ngOnInit e inicializa o formulário
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve inicializar o formulário com campos vazios e inválidos', () => {
    expect(component.cadastroForm).toBeDefined();
    expect(component.cadastroForm.valid).toBe(false);
  });

  it('deve barrar o envio e mostrar um alerta se o formulário estiver inválido', () => {
    component.salvarCliente();

    expect(window.alert).toHaveBeenCalledWith(
      'Por favor, preencha todos os campos obrigatórios corretamente.',
    );
    expect(mockClienteService.cadastrar).not.toHaveBeenCalled();
  });

  it('deve limpar as máscaras de CPF e telefone e realizar o cadastro (POST) com sucesso', () => {
    // Configura o mock para simular sucesso no cadastro (retorna um Observable de sucesso)
    mockClienteService.cadastrar.mockReturnValue(of({}));

    // Preenche o formulário simulando dados com máscara vindo da tela
    component.cadastroForm.setValue({
      id: '',
      nome: 'Larissa Fonseca',
      email: 'larissa@email.com',
      cpf: '123.456.789-00',
      telefone: '(43) 99999-8888',
      endereco: {
        cep: '86000-000',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: '',
        bairro: 'Centro',
        cidade: 'Londrina',
        uf: 'PR',
      },
    });

    component.salvarCliente();

    // Valida se as strings foram limpas (removendo a pontuação e parênteses)
    expect(mockClienteService.cadastrar).toHaveBeenCalledWith({
      nome: 'Larissa Fonseca',
      email: 'larissa@email.com',
      cpf: '12345678900',
      telefone: '43999998888',
      endereco: {
        cep: '86000000',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: '',
        bairro: 'Centro',
        cidade: 'Londrina',
        uf: 'PR',
      },
    });

    expect(window.alert).toHaveBeenCalledWith('Cadastro realizado com sucesso!');
    // Verifica se o formulário foi resetado após o sucesso
    expect(component.cadastroForm.value.nome).toBeNull();
  });

  it('deve realizar a atualização (PUT) se o formulário contiver um ID', () => {
    mockClienteService.atualizar.mockReturnValue(of({}));

    component.cadastroForm.setValue({
      id: '5', // ID preenchido indica edição
      nome: 'Larissa Fonseca',
      email: 'larissa@email.com',
      cpf: '12345678900',
      telefone: '43999998888',
      endereco: {
        cep: '86000000',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: '',
        bairro: 'Centro',
        cidade: 'Londrina',
        uf: 'PR',
      },
    });

    component.salvarCliente();

    expect(mockClienteService.atualizar).toHaveBeenCalled();
    expect(mockClienteService.cadastrar).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Cadastro atualizado com sucesso!');
  });

  it('deve tratar erro da API ao tentar cadastrar', () => {
    // Força o serviço a retornar uma exceção/erro assíncrono
    mockClienteService.cadastrar.mockReturnValue(throwError(() => new Error('Erro de banco')));

    component.cadastroForm.setValue({
      id: '',
      nome: 'Larissa Fonseca',
      email: 'larissa@email.com',
      cpf: '12345678900',
      telefone: '43999998888',
      endereco: {
        cep: '86000000',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: '',
        bairro: 'Centro',
        cidade: 'Londrina',
        uf: 'PR',
      },
    });

    component.salvarCliente();

    expect(window.alert).toHaveBeenCalledWith('Erro ao salvar. Verifique os dados informados.');
  });
});
