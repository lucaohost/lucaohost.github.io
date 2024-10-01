# Repositório de Deploy
## Projeto: [Front-end E-commerce](https://github.com/lucaohost/frontend-ecommerce)

Este projeto foi hospedado utilizando [Github Pages](https://pages.github.com/)
Link: https://lucaohost.github.io/

### Pré Requisitos
* [Npm](https://www.npmjs.com/)
* [Vue](https://vuejs.org/)

### Deloy Projeto
```
Lembre de substituir 'seuUsernameGithub' pelo seu user do github em todos os comandos necessários e remova '#' dos mesmos
```

```
# ssh-keygen -f ~/.ssh/seuUsernameGithub
```
```
# ssh-add ~/.ssh/seuUsernameGithub
```
```
Vai no github e cria um repo seuUsernameGithub.github.io
Vai em Setting > Deploy Key > Adiciona chave pública que tu gerou ali em cima
```
```
Vai para alguma pasta e abra o terminal
```
```
git clone git@github.com:lucaohost/frontend-ecommerce.git
```
```
cd frontend-ecommerce
```

```
sudo npm install
```
```
sudo npm run build
```
```
cd dist
```
```
sudo git init
```
```
sudo git add .
```
```
sudo git commit -m "Deploy"
```
```
# sudo git remote add origin git@github.com:seuUsernameGithub/seuUsernameGithub.github.io.git
```
```
git push -u origin main
```
ou
```
git push -u origin master
```
PS:
- O último comando vai funcionar com, ou sem sudo, dependendo se tu usou sudo na hora de gerar a ssh key 
- Pra fazer deploy de modificações, é preciso gerar um build novo.
- a única forma que consegui para fazer um segundo deploy, é excluindo o repositório, criando um novo com o mesmo nome, adicionando a deploy key já gerada e repetindo o resto do processo. 
