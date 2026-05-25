import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Agendamento } from '../models/agendamento.model';

@Injectable({
  providedIn: 'root',
})
export class AgendamentoService {
  private readonly API = 'http://localhost:8080/agendamentos';

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get<any>(this.API);
  }

  cancelar(id: number): Observable<any> {
    return this.http.put(`${this.API}/${id}/cancelar`, {});
  }

  detalhar(id: number): Observable<any> {
    return this.http.get<any>(`${this.API}/${id}`);
  }

  atualizarAdmin(id: number, dados: any): Observable<any> {
    return this.http.put<any>(`${this.API}/admin/${id}`, dados);
  }

  cadastrar(agendamento: Agendamento): Observable<string> {
    return this.http.post(this.API, agendamento, {
      responseType: 'text',
    }) as Observable<string>;
  }

  listarPorCliente(id: number): Observable<any> {
    return this.http.get<any>(`${this.API}/cliente/${id}`);
  }

  atualizar(id: number, agendamento: any): Observable<string> {
    return this.http.put(this.API + '/' + id, agendamento, { responseType: 'text' });
  }

  listarPendentes(pagina: number, tamanho: number = 10): Observable<any> {
    return this.http.get<any>(`${this.API}/pendentes?page=${pagina}&size=${tamanho}`);
  }

  confirmar(id: number): Observable<any> {
    return this.http.put<any>(`${this.API}/confirmar/${id}`, {});
  }

  listarPorPeriodo(inicio: string, fim: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}?inicio=${inicio}&fim=${fim}`);
  }

  // Cancelamento feito pela própria cliente (Possui validação de 48h)
  cancelarCliente(id: number): Observable<any> {
    return this.http.patch(`${this.API}/cancelar/${id}`, {}, { responseType: 'text' });
  }

  // Cancelamento administrativo (Livre de travas de horário)
  cancelarAdmin(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API}/admin/cancelar/${id}`, {});
  }

  finalizar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API}/finalizar/${id}`, {});
  }
}
