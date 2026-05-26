import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Cliente } from '../models/cliente.model';
import { ClienteService } from './cliente';

describe('ClienteService', () => {
  let service: ClienteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClienteService,
        provideHttpClient(), // Ativa o cliente HTTP no ambiente de testes
        provideHttpClientTesting(), // Injeta o controlador para mocar as requisições HTTP
      ],
    });

    service = TestBed.inject(ClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Executa uma validação após cada teste para garantir que nenhuma requisição ficou pendente
  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('deve disparar um POST para cadastrar um cliente', () => {
    const novoCliente: Cliente = {
      nome: 'Larissa',
      email: 'lari@email.com',
      cpf: '12345678900',
      telefone: '43999999999',
      endereco: {} as any,
    };

    // Dispara a chamada do método (que é um Observable)
    service.cadastrar(novoCliente).subscribe((resposta) => {
      expect(resposta).toEqual(novoCliente);
    });

    // Intercepta a requisição que o Angular tentou fazer
    const req = httpMock.expectOne('http://localhost:8080/clientes');
    expect(req.request.method).toBe('POST'); // Valida o verbo HTTP correto

    // Envia o dado de mentira para o "subscribe" fechar com sucesso
    req.flush(novoCliente);
  });

  it('deve disparar um GET com os parâmetros corretos para listar clientes paginados', () => {
    const dadosPaginadosFicticios = {
      content: [{ nome: 'Larissa' }],
      totalPages: 1,
    };

    service.listarPaginado(0, 5).subscribe((resposta) => {
      expect(resposta.content.length).toBe(1);
      expect(resposta.totalPages).toBe(1);
    });

    // Valida se a URL foi montada com os Query Parameters corretos (?page=0&size=5)
    const req = httpMock.expectOne('http://localhost:8080/clientes?page=0&size=5');
    expect(req.request.method).toBe('GET');

    req.flush(dadosPaginadosFicticios);
  });

  it('deve disparar um GET passando o CPF na URL', () => {
    const clienteRetornado: Cliente = {
      cpf: '11122233344',
      nome: 'Maria',
      email: 'maria@email.com',
      telefone: '4388888888',
      endereco: {} as any,
    };

    service.buscarPorCpf('11122233344').subscribe((cliente) => {
      expect(cliente.nome).toBe('Maria');
    });

    const req = httpMock.expectOne('http://localhost:8080/clientes/cpf/11122233344');
    expect(req.request.method).toBe('GET');

    req.flush(clienteRetornado);
  });

  it('deve disparar um DELETE com o id correspondente', () => {
    service.excluir('abc-123').subscribe((resposta) => {
      expect(resposta).toBeNull();
    });

    const req = httpMock.expectOne('http://localhost:8080/clientes/abc-123');
    expect(req.request.method).toBe('DELETE');

    req.flush(null); // Responde com void/null
  });
});
