# Mapa de Arquitetura do Sistema

## 1. Fluxo de Execução (Jornada dos Dados)

O fluxo de execução do sistema inicia com uma requisição HTTP recebida por um endpoint de API e prossegue através de uma arquitetura em camadas, delegando responsabilidades entre componentes.

1.  **Entrada da Requisição (Controller)**:
    *   Uma requisição HTTP `POST` para o endpoint `/api/usuarios/registrar` é recebida pelo componente `exemplo_controller.py`.
    *   Este controller atua como a interface de entrada do sistema, validando primariamente o método HTTP da requisição.
    *   Após a validação do método, o controller extrai os dados necessários do corpo da requisição (nome, email, senha).
    *   O `exemplo_controller.py` delega a lógica de negócio principal para o serviço de backend, invocando a função `cadastrar_novo_usuario` presente no módulo `exemplo_backend.py`.

2.  **Processamento da Lógica de Negócio (Service)**:
    *   O componente `exemplo_backend.py`, que atua como um serviço, é responsável por executar as regras de negócio e persistência de dados.
    *   Dentro do serviço, são realizadas validações de entrada cruciais:
        *   Verificação da validade e unicidade do e-mail.
        *   Validação do comprimento mínimo da senha.
    *   A senha fornecida é criptografada utilizando o algoritmo SHA-256 antes do armazenamento.
    *   Os dados do novo usuário (nome, email, senha criptografada) são então armazenados em uma simulação de banco de dados em memória.
    *   O serviço retorna o resultado da operação (sucesso ou falha com uma mensagem de erro específica) para o controller.

3.  **Resposta da API (Controller)**:
    *   De volta ao `exemplo_controller.py`, o resultado recebido do serviço de backend é processado.
    *   Em caso de sucesso, o controller retorna uma resposta HTTP com status `201 Created`.
    *   Em caso de falha, seja por um método HTTP incorreto (não-POST) ou por um erro de validação de negócio reportado pelo backend, o controller retorna uma resposta HTTP com status `400 Bad Request` ou `405 Method Not Allowed`, acompanhada de uma mensagem de erro descritiva.

Este fluxo estabelece uma clara separação de preocupações, onde o controller gerencia a interação com a API e o serviço encapsula a lógica de negócio e a manipulação de dados.

## 2. Mapa de Dependências e Componentes

| Componente           | Arquivo                | Papel                   | Dependências Externas | Entidades de Banco de Dados | Endpoints de API Expostos |
| :------------------- | :--------------------- | :---------------------- | :-------------------- | :-------------------------- | :------------------------ |
| **Controller**       | `exemplo_controller.py` | Orquestrador de API, camada de entrada, delega lógica de negócio. | `codigo_backend.exemplo_backend` | N/A (não manipula dados diretamente) | `POST /api/usuarios/registrar` |
| **Service**          | `exemplo_backend.py`   | Implementa lógica de negócio para gerenciamento de usuários, validação e criptografia. | `hashlib`               | `Usuário` (nome, email, senha criptografada) | N/A (funcionalidade interna, não expõe API) |

## 3. Regras de Negócio Consolidadas

As seguintes regras de negócio foram identificadas e consolidadas a partir dos componentes do sistema:

### 3.1. Regras de Requisição e Endpoint
*   A requisição para registrar um novo usuário deve obrigatoriamente utilizar o método HTTP `POST`.

### 3.2. Regras de Cadastro de Usuário
*   O e-mail fornecido para cadastro deve ser um endereço válido (i.e., deve conter o caractere '@').
*   O e-mail fornecido para cadastro deve ser único no sistema; não é permitido cadastrar um usuário com um e-mail já existente.
*   A senha fornecida para cadastro deve possuir um comprimento mínimo de 6 caracteres.
*   A operação de registro de usuário é processada pela função de negócio `cadastrar_novo_usuario`, encapsulada no serviço de backend.

### 3.3. Regras de Segurança e Armazenamento
*   As senhas dos usuários devem ser armazenadas de forma criptografada, utilizando o algoritmo SHA-256.

## 4. Segurança e Tratamento de Erros Global

### 4.1. Segurança
O sistema incorpora medidas de segurança focadas na proteção de informações sensíveis dos usuários:
*   **Criptografia de Senhas**: As senhas dos usuários são armazenadas em formato criptografado usando o algoritmo SHA-256. Isso previne o acesso direto às senhas originais em caso de violação do banco de dados (simulado).
*   **Robustez de Senha**: É imposta uma validação de comprimento mínimo para senhas (6 caracteres), visando incentivar a criação de senhas mais fortes e dificultar ataques de força bruta.

### 4.2. Tratamento de Erros
O sistema implementa um tratamento de erros em camadas, garantindo que falhas sejam identificadas e comunicadas adequadamente ao cliente:
*   **Validação de Método HTTP**: O controller é responsável por validar o método da requisição. Se um método diferente de `POST` for utilizado para o registro de usuário, o sistema responde com um status `405 Method Not Allowed` e uma mensagem informativa.
*   **Validações de Negócio no Serviço**: O serviço de backend é o ponto central para validações de regras de negócio. Erros como e-mail inválido, e-mail já cadastrado ou senha abaixo do comprimento mínimo resultam em uma falha de processamento no serviço.
*   **Propagação de Erros**: Erros originados no serviço de backend são capturados pelo controller. O controller, por sua vez, retorna um status `400 Bad Request` ao cliente, acompanhado da mensagem de erro específica fornecida pelo serviço, permitindo que o cliente entenda a causa da falha.
*   **Mensagens de Erro Descritivas**: Em todos os cenários de erro mapeados, o sistema fornece mensagens de erro claras e informativas, auxiliando na depuração e na experiência do usuário.