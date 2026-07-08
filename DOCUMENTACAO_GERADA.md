# 🛠️ Documentação Técnica do Módulo de Autenticação

## 1. Visão Geral e Arquitetura

Este módulo Python (`user_management.py` - nome inferido) é responsável por gerenciar operações básicas de autenticação de usuários, especificamente o registro de novos usuários. Ele simula um sistema de armazenamento de dados utilizando um dicionário em memória (`BANCO_DE_DADOS_USUARIOS`) para persistir informações de usuário de forma temporária. A arquitetura é de um serviço monolítico simplificado, onde as funções de validação e persistência (simulada) residem no mesmo contexto. O propósito macro é demonstrar um fluxo básico de cadastro de usuários, incluindo validações de entrada e o uso de técnicas de hashing para segurança de senhas.

## 2. Dicionário de Funções

| Nome da Função         | Parâmetros esperados (e tipos)                                    | O que ela retorna             | Descrição curta                                                                                                      |
| :--------------------- | :---------------------------------------------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `criptografar_senha`   | `senha` (str): A senha em texto puro a ser criptografada.         | `str`                         | Recebe uma string de senha e retorna o seu hash utilizando o algoritmo SHA-256 em formato hexadecimal.                 |
| `cadastrar_novo_usuario`| `nome` (str): O nome do usuário.<br>`email` (str): O e-mail do usuário, usado como identificador único.<br>`senha_pura` (str): A senha do usuário em texto puro. | `dict`                        | Tenta cadastrar um novo usuário no sistema. Realiza validações de e-mail e senha, criptografa a senha e armazena os dados. Retorna um dicionário indicando sucesso ou falha, com uma mensagem ou erro. |

## 3. Análise de Regras de Negócio e Segurança

### Regras de Negócio e Validações:

O módulo implementa as seguintes regras de negócio e validações para o processo de cadastro de usuário:

*   **Validação de Formato de E-mail:** O e-mail fornecido não pode ser uma string vazia e deve conter o caractere '@'. Caso contrário, o cadastro falha com um erro de "E-mail inválido".
*   **Validação de Unicidade de E-mail:** O e-mail fornecido não deve já estar cadastrado no `BANCO_DE_DADOS_USUARIOS`. Se o e-mail já existir, o cadastro falha com um erro de "Este e-mail já está cadastrado.".
*   **Validação de Comprimento Mínimo de Senha:** A senha em texto puro (`senha_pura`) deve ter um comprimento mínimo de 6 caracteres. Senhas mais curtas resultam em falha no cadastro com o erro "A senha deve ter pelo menos 6 caracteres.".
*   **Armazenamento de Dados:** Após todas as validações, o nome do usuário e a senha criptografada são armazenados no `BANCO_DE_DADOS_USUARIOS`, utilizando o e-mail como chave primária.

### Técnica de Segurança/Criptografia:

*   **Hashing de Senhas:** Para proteger as senhas dos usuários, o módulo utiliza o algoritmo de hash **SHA-256 (Secure Hash Algorithm 256)**.
    *   A função `criptografar_senha` pega a senha em texto puro, codifica-a para UTF-8 e então aplica o algoritmo SHA-256. O resultado é retornado como uma string hexadecimal.
    *   Isso garante que as senhas não sejam armazenadas em texto puro no `BANCO_DE_DADOS_USUARIOS`, minimizando o risco em caso de uma eventual violação de dados do "banco".
    *   **Observação de Arquitetura:** Embora SHA-256 seja um algoritmo de hash criptográfico, para armazenamento seguro de senhas em sistemas de produção, é altamente recomendável utilizar algoritmos mais robustos projetados especificamente para senhas, como **bcrypt**, **scrypt** ou **Argon2**. Esses algoritmos incorporam salting e key stretching (alongamento de chave) que aumentam significativamente a resistência contra ataques de força bruta e tabelas arco-íris (rainbow tables), mesmo que o hash seja exposto.

## 4. Exemplos de Uso (Inputs e Outputs)

Aqui estão exemplos de como interagir com a função principal `cadastrar_novo_usuario` e os dicionários que ela retorna em diferentes cenários:

```python
# Importa a função (assumindo que o código está em um arquivo chamado 'user_module.py')
# from user_module import cadastrar_novo_usuario, BANCO_DE_DADOS_USUARIOS

# Cenário 1: Cadastro de usuário com sucesso
print("--- Cenário de Sucesso ---")
resultado_sucesso = cadastrar_novo_usuario("Alice Silva", "alice.silva@example.com", "SenhaSegura123")
print(f"Input: cadastrar_novo_usuario('Alice Silva', 'alice.silva@example.com', 'SenhaSegura123')")
print(f"Output: {resultado_sucesso}")
# Conteúdo simulado do banco após o cadastro:
# print(f"BANCO_DE_DADOS_USUARIOS: {BANCO_DE_DADOS_USUARIOS}")
# Esperado:
# {'alice.silva@example.com': {'nome': 'Alice Silva', 'senha': '...'}}
print("-" * 30)

# Cenário 2: Tentativa de cadastro com e-mail inválido (sem '@')
print("--- Cenário de Erro: E-mail Inválido ---")
resultado_email_invalido = cadastrar_novo_usuario("Bob", "bob.example.com", "minhasenhaforte")
print(f"Input: cadastrar_novo_usuario('Bob', 'bob.example.com', 'minhasenhaforte')")
print(f"Output: {resultado_email_invalido}")
print("-" * 30)

# Cenário 3: Tentativa de cadastro com e-mail já existente
print("--- Cenário de Erro: E-mail Já Cadastrado ---")
# Assumindo que 'alice.silva@example.com' já foi cadastrado no Cenário 1
resultado_email_existente = cadastrar_novo_usuario("Alice Nova", "alice.silva@example.com", "NovaSenha123")
print(f"Input: cadastrar_novo_usuario('Alice Nova', 'alice.silva@example.com', 'NovaSenha123')")
print(f"Output: {resultado_email_existente}")
print("-" * 30)

# Cenário 4: Tentativa de cadastro com senha muito curta
print("--- Cenário de Erro: Senha Curta ---")
resultado_senha_curta = cadastrar_novo_usuario("Carlos", "carlos@example.com", "123")
print(f"Input: cadastrar_novo_usuario('Carlos', 'carlos@example.com', '123')")
print(f"Output: {resultado_senha_curta}")
print("-" * 30)

# Cenário 5: Tentativa de cadastro com e-mail vazio
print("--- Cenário de Erro: E-mail Vazio ---")
resultado_email_vazio = cadastrar_novo_usuario("Diana", "", "senhadiana")
print(f"Input: cadastrar_novo_usuario('Diana', '', 'senhadiana')")
print(f"Output: {resultado_email_vazio}")
print("-" * 30)
```