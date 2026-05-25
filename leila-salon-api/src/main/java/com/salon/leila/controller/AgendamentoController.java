package com.salon.leila.controller;

import com.salon.leila.agendamento.Agendamento;
import com.salon.leila.agendamento.AgendamentoRepository;
import com.salon.leila.agendamento.DadosCadastroAgendamento;
import com.salon.leila.cliente.Cliente;
import com.salon.leila.cliente.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/agendamentos")
@CrossOrigin(origins = "http://localhost:4200")
public class AgendamentoController {

    @Autowired
    private AgendamentoRepository repository;

    @Autowired
    private ClienteRepository clienteRepository;

    public enum StatusAgendamento {
        PENDENTE,
        CONFIRMADO,
        FINALIZADO,
        CANCELADO
    }

    @PostMapping
    @Transactional
    public String cadastrar(@RequestBody DadosCadastroAgendamento dados) {

        Cliente cliente = clienteRepository.findByCpf(dados.cpf())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        LocalDateTime data = dados.data();

        if (data.isBefore(LocalDateTime.now())) {
            return "Não é possível realizar agendamentos em datas ou horários passados.";
        }

        var horarioOcupado = repository.findByDataAndStatus(data, StatusAgendamento.CONFIRMADO);
        if (horarioOcupado.isPresent()) {
            return "Desculpe, este horário já foi preenchido por outra cliente. Por favor, escolha outro horário.";
        }

        LocalDateTime inicioSemana = data.toLocalDate().with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime fimSemana = data.toLocalDate().with(DayOfWeek.SUNDAY).atTime(23,59,59);

        // busca todas as marcações da semana para esse cliente
        List<Agendamento> agendamentosSemana =
                repository.findByClienteIdAndDataBetween(cliente.getId(), inicioSemana, fimSemana);

        // filtra procurando se ALGUM deles está PENDENTE ou CONFIRMADO
        boolean possuiAgendamentoAtivo = agendamentosSemana.stream()
                .anyMatch(a -> a.getStatus() == StatusAgendamento.PENDENTE
                        || a.getStatus() == StatusAgendamento.CONFIRMADO);

        // se encontrar um horário ativo, bloqueia o novo agendamento
        if (possuiAgendamentoAtivo) {
            Agendamento ativo = agendamentosSemana.stream()
                    .filter(a -> a.getStatus() == StatusAgendamento.PENDENTE
                            || a.getStatus() == StatusAgendamento.CONFIRMADO)
                    .findFirst()
                    .get();

            return "Cliente já possui um agendamento ativo nesta semana. Horário marcado: "
                    + ativo.getData();
        }

        Agendamento agendamento = new Agendamento();
        agendamento.setCliente(cliente);
        agendamento.setData(data);
        agendamento.setServicos(dados.servicos());
        agendamento.setAtivo(true);
        agendamento.setStatus(StatusAgendamento.PENDENTE);

        repository.save(agendamento);

        return "Agendamento criado com sucesso";
    }

    @PutMapping("/{id}")
    @Transactional
    public String atualizar(@PathVariable Long id, @RequestBody DadosCadastroAgendamento dados) {

        Agendamento agendamento = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado"));

        if (agendamento.getStatus() == StatusAgendamento.CANCELADO) {
            return "Agendamento cancelado não pode ser alterado";
        }

        if (agendamento.getStatus() == StatusAgendamento.FINALIZADO) {
            return "Agendamento finalizado não pode ser alterado";
        }

        LocalDateTime agora = LocalDateTime.now();
        long horas = Duration.between(agora, agendamento.getData()).toHours();

        if (horas < 48) {
            return "Atenção: A alteração só pode ser feita com 48 horas de antecedência. Em caso de imprevistos, ligue para o salão.";
        }

        agendamento.setData(dados.data());
        agendamento.setServicos(dados.servicos());
        agendamento.setStatus(StatusAgendamento.PENDENTE);

        return "Agendamento atualizado com sucesso!";
    }

    @PutMapping("/admin/{id}")
    @Transactional
    public void atualizarAdmin(@PathVariable Long id, @RequestBody DadosCadastroAgendamento dados) {

        Agendamento agendamento = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado"));

        agendamento.setData(dados.data());
        agendamento.setServicos(dados.servicos());
    }

    @GetMapping
    public List<Agendamento> listarPorPeriodo(
            @RequestParam LocalDateTime inicio,
            @RequestParam LocalDateTime fim
    ) {
        return repository.findByDataBetween(inicio, fim);
    }

    @GetMapping("/{id}")
    public Agendamento detalhar(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado"));
    }

    @PutMapping("/confirmar/{id}")
    @Transactional
    public ResponseEntity<?> confirmar(@PathVariable Long id) {

        Agendamento agendamento = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado"));

        if (agendamento.getStatus() != StatusAgendamento.PENDENTE) {
            return ResponseEntity.badRequest().body("Somente agendamentos pendentes podem ser confirmados.");
        }

        // verifica se há conflito de horário
        var conflito = repository.findByDataAndStatus(agendamento.getData(), StatusAgendamento.CONFIRMADO);

        if (conflito.isPresent()) {
            java.util.List<String> sugestoes = new java.util.ArrayList<>();
            LocalDateTime tentativa = agendamento.getData();

            // loop para buscar até 3 sugestões
            while (sugestoes.size() < 3) {
                tentativa = tentativa.plusHours(1); // Tenta de hora em hora

                // se passar das 19h (fim do expediente), pula para as 08:00 do dia seguinte
                if (tentativa.getHour() > 19) {
                    tentativa = tentativa.plusDays(1).withHour(8).withMinute(0).withSecond(0);
                }

                // evita sugerir domingos
                if (tentativa.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                    tentativa = tentativa.plusDays(1).withHour(8).withMinute(0);
                }

                // verifica se já existe um agendamento CONFIRMADO nesse horário
                var jaTemConfirmado = repository.findByDataAndStatus(tentativa, StatusAgendamento.CONFIRMADO);

                // verifica se já existe outra contraproposta PENDENTE segurando essa mesma vaga
                var jaTemPendente = repository.findByDataAndStatus(tentativa, StatusAgendamento.PENDENTE);

                // só sugere o horário se ele estiver 100% livre de confirmados E de outras pendências!
                if (jaTemConfirmado.isEmpty() && jaTemPendente.isEmpty()) {
                    sugestoes.add(tentativa.toString());
                }
            }

            java.util.Map<String, Object> erroResponse = new java.util.HashMap<>();
            erroResponse.put("error", "CONFLITO");
            erroResponse.put("message", "Este horário já está ocupado por outro atendimento confirmado.");
            erroResponse.put("sugestoes", sugestoes);

            return ResponseEntity.status(409).body(erroResponse);
        }

        agendamento.setStatus(StatusAgendamento.CONFIRMADO);

        return ResponseEntity.ok().body("{\"message\": \"Agendamento confirmado com sucesso!\"}");
    }

    @GetMapping("/cliente/{id}")
    public List<Agendamento> listarCliente(@PathVariable Long id) {
        return repository.findByClienteId(id);
    }

    @GetMapping("/pendentes")
    public Page<Agendamento> listarPendentes(
            @PageableDefault(size = 10, sort = {"data"}) Pageable paginacao
    ) {
        return repository.findByStatus(StatusAgendamento.PENDENTE, paginacao);
    }

    @PatchMapping("/cancelar/{id}")
    @Transactional
    public void cancelar(@PathVariable Long id) {

        Agendamento agendamento = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado"));

        LocalDateTime agora = LocalDateTime.now();

        long horas = Duration.between(agora, agendamento.getData()).toHours();

        if (horas < 48) {
            throw new RuntimeException(
                    "Cancelamento só permitido com 2 dias de antecedência"
            );
        }

        agendamento.setStatus(StatusAgendamento.CANCELADO);
    }

    @PatchMapping("/admin/cancelar/{id}")
    @Transactional
    public void cancelarAdmin(@PathVariable Long id) {

        Agendamento agendamento = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado"));

        agendamento.setStatus(StatusAgendamento.CANCELADO);
    }

    @PatchMapping("/finalizar/{id}")
    @Transactional
    public void finalizar(@PathVariable Long id) {

        Agendamento agendamento = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado"));

        if (agendamento.getStatus() != StatusAgendamento.CONFIRMADO) {
            throw new RuntimeException(
                    "Somente agendamentos confirmados podem ser finalizados"
            );
        }

        agendamento.setStatus(StatusAgendamento.FINALIZADO);
    }
}
