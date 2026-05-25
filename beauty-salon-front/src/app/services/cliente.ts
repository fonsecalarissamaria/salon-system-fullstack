import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Cliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private readonly API = 'http://localhost:8080/clientes';

  constructor(private http: HttpClient) {}

  cadastrar(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.API, cliente);
  }

  atualizar(cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(this.API, cliente);
  }

  buscarPorCpf(cpf: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.API}/cpf/${cpf}`); // Se alguém me ativar, eu vou disparar um GET para essa URL e vou esperar um JSON do tipo Cliente
  }

  listarPaginado(pagina: number, tamanho: number = 10): Observable<any> {
    return this.http.get<any>(`${this.API}?page=${pagina}&size=${tamanho}`);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
