# GUIA DE ENGENHARIA DO BACKEND

## 1. Visão Geral do Sistema

O sistema implementa uma arquitetura em camadas para o processamento de requisições HTTP, focada na separação de preocupações entre a interface da API, a lógica de negócio e a persistência de dados. O fluxo de execução inicia com a recepção de uma requisição HTTP por um componente `Controller`, que atua como orquestrador, validando a requisição e delegando a lógica de negócio a um componente `Service`. O `Service` é responsável por executar as regras de negócio, realizar validações específicas, aplicar medidas de segurança como criptografia de dados sensíveis e gerenciar a persistência em uma simulação de banco de dados em memória. A resposta final é formulada e retornada pelo `Controller` com base no resultado do processamento do `Service`.

Esta estrutura garante modularidade, reusabilidade e facilita a manutenção, com o `Controller` gerenciando exclusivamente a interação da API e o `Service` encapsulando toda a inteligência de domínio e manipulação de dados.

## 2. Endpoints e Rotas Disponíveis

Este backend expõe um único endpoint para o gerenciamento de usuários.

### 2.1. Registro de Novo Usuário

*   **Endpoint:** `/api/usuarios/registrar`
*   **Método HTTP:** `POST`
*   **Descrição:** Este endpoint permite o registro de um novo usuário no sistema.
*   **Corpo da Requisição (JSON):**
    ```json
    {
        "nome": "string",
        "email": "string",
        "senha": "string"
    }
    ```
    *   `nome` (string): Nome completo do usuário.
    *   `email` (string): Endereço de e-mail do usuário. Deve ser válido e único no sistema.
    *   `senha` (string): Senha para acesso do usuário. Deve possuir um comprimento mínimo de 6 caracteres.

*   **Respostas Possíveis:**

    *   **201 Created:**
        *   **Condição:** Usuário registrado com sucesso.
        *   **Corpo da Resposta:** Vazio.
        *   **Exemplo:**
            ```http
            HTTP/1.1 201 Created
            ```

    *   **400 Bad Request:**
        *   **Condição:** A requisição falhou devido a uma validação de negócio ou formato inválido de dados.
        *   **Corpo da Resposta (JSON):** Contém uma mensagem descritiva do erro.
        *   **Exemplo (E-mail inválido):**
            ```json
            {
                "erro": "E-mail inválido."
            }
            ```
        *   **Exemplo (E-mail já cadastrado):**
            ```json
            {
                "erro": "E-mail já cadastrado."
            }
            ```
        *   **Exemplo (Senha curta):**
            ```json
            {
                "erro": "Senha deve ter no mínimo 6 caracteres."
            }
            ```

    *   **405 Method Not Allowed:**
        *   **Condição:** O método HTTP utilizado na requisição não é `POST`.
        *   **Corpo da Resposta (JSON):** Contém uma mensagem indicando o método permitido.
        *   **Exemplo:**
            ```json
            {
                "erro": "Método não permitido. Utilize POST para /api/usuarios/registrar."
            }
            ```

## 3. Segurança e Criptografia

O sistema incorpora as seguintes medidas de segurança para proteção de dados sensíveis:

*   **Criptografia de Senhas (SHA-256):** Todas as senhas de usuários são criptografadas utilizando o algoritmo SHA-256 antes de serem armazenadas na simulação de banco de dados. Este método impede o armazenamento de senhas em texto claro, mitigando o risco de exposição de credenciais em caso de acesso não autorizado ao repositório de dados. O algoritmo SHA-256 é uma função hash criptográfica unidirecional, tornando inviável a recuperação da senha original a partir de sua versão criptografada.

*   **Robustez de Senha por Comprimento Mínimo:** É imposta uma validação para garantir que as senhas fornecidas pelos usuários possuam um comprimento mínimo de 6 caracteres. Esta regra visa aumentar a complexidade das senhas, dificultando ataques de força bruta e dicionário, e promovendo a criação de credenciais mais seguras pelos usuários. A validação é executada na camada de serviço, antes da persistência.

## 4. Guia de Manutenção e Extensão

Este guia detalha o padrão arquitetural para manutenção e extensão do backend, assegurando consistência e aderência aos princípios de separação de preocupações.

### 4.1. Estrutura Arquitetural

O sistema adota uma arquitetura em camadas composta primariamente por `Controller` e `Service`:

*   **Controller (e.g., `exemplo_controller.py`):**
    *   **Responsabilidade:** Orquestração de requisições HTTP, validação de métodos HTTP, extração de parâmetros de requisição, delegação da lógica de negócio para o `Service`, e formulação da resposta HTTP final (status code, corpo da resposta).
    *   **Características:** Não contém lógica de negócio complexa ou manipulação direta de dados. Atua como uma camada de tradução entre o protocolo HTTP e a camada de serviço.
    *   **Dependências:** Depende diretamente de um ou mais módulos de `Service`.

*   **Service (e.g., `exemplo_backend.py`):**
    *   **Responsabilidade:** Implementação de toda a lógica de negócio, validações de domínio, manipulação de dados, aplicação de regras de segurança (e.g., criptografia) e interação com a camada de persistência (simulada em memória).
    *   **Características:** Encapsula o comportamento do sistema para uma funcionalidade específica. Retorna resultados da operação (sucesso ou falha com mensagens específicas) para o `Controller`.
    *   **Dependências:** Pode depender de bibliotecas auxiliares (e.g., `hashlib` para criptografia) e de módulos de persistência de dados.

### 4.2. Adição de Novas Funcionalidades (Endpoints e Lógica de Negócio)

Para estender o sistema com uma nova funcionalidade que requer um novo endpoint de API:

1.  **Definição do Endpoint no Controller:**
    *   Crie uma nova função dentro do `exemplo_controller.py` (ou em um novo arquivo de controller se a funcionalidade for substancialmente diferente) para manipular o novo endpoint.
    *   Defina o método HTTP (`GET`, `POST`, `PUT`, `DELETE`) e o caminho da rota.
    *   Implemente a validação inicial do método HTTP.
    *   Extraia os dados relevantes do corpo da requisição ou dos parâmetros de URL.
    *   Invoque a função correspondente na camada de `Service` para executar a lógica de negócio.
    *   Processe o resultado retornado pelo `Service` e construa a resposta HTTP apropriada (status code, corpo da resposta, cabeçalhos). Certifique-se de tratar tanto os cenários de sucesso quanto os de erro.

2.  **Implementação da Lógica de Negócio no Service:**
    *   Crie uma nova função dentro do `exemplo_backend.py` (ou em um novo arquivo de serviço se a funcionalidade for de um domínio diferente) que corresponda à chamada do `Controller`.
    *   Implemente todas as regras de negócio associadas a essa funcionalidade (e.g., validações de entrada, lógica de processamento, transformações de dados).
    *   Integre quaisquer medidas de segurança necessárias (e.g., criptografia para dados sensíveis).
    *   Interaja com o mecanismo de persistência de dados (simulado ou real) para ler, gravar, atualizar ou excluir informações.
    *   Retorne um resultado claro da operação. Em caso de falha, retorne uma mensagem de erro descritiva que possa ser interpretada e repassada ao cliente pelo `Controller`.

3.  **Atualização das Regras de Negócio e Segurança:**
    *   Qualquer nova regra de negócio ou medida de segurança introduzida deve ser formalmente documentada e implementada primariamente na camada de `Service`.
    *   Garanta que a camada de `Service` seja a única responsável por essas regras, mantendo o `Controller` agnóstico à lógica de negócio.

4.  **Tratamento de Erros:**
    *   Mantenha o padrão de tratamento de erros em camadas. Erros de método HTTP são tratados no `Controller`. Erros de validação de negócio são gerados no `Service` e propagados para o `Controller`, que os mapeia para respostas `400 Bad Request` com mensagens informativas.
    *   As mensagens de erro devem ser claras, concisas e úteis para o desenvolvedor cliente.

### 4.3. Gerenciamento de Dependências

*   Mantenha as dependências explícitas e mínimas para cada componente.
*   Bibliotecas externas (e.g., `hashlib`) devem ser importadas nos módulos onde são diretamente utilizadas, preferencialmente na camada de `Service` para lógica de negócio e segurança.

Ao seguir estas diretrizes, novos desenvolvedores podem estender o sistema de forma consistente, mantendo a integridade arquitetural e a clareza do código.