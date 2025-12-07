// src/SistemaLoja.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from 'recharts';

import {
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle,
  Filter,
  Mail,
} from 'lucide-react';

import { supabase } from './supabaseClient';

// ===============================
// VALORES PADRÃO
// ===============================

const defaultUsuarios = [
  { login: 'admin',  senha: '1087', perfil: 'ADM',   nome: 'Administrador' },
  { login: 'gerente', senha: '123', perfil: 'GER',   nome: 'Gerente Silva' },
  { login: 'venda1',  senha: '123', perfil: 'VENDA', nome: 'Vendedor João' },
  { login: 'venda2',  senha: '123', perfil: 'VENDA', nome: 'Vendedor Maria' },
];

const defaultPromissorias = [];

// ===============================
// COMPONENTE PRINCIPAL
// ===============================

const SistemaLoja = () => {
  // ===== Estilo global (Arial) =====
  const appStyle = { fontFamily: 'Arial, Helvetica, sans-serif' };

  // ===== Autenticação =====
  const [usuario, setUsuario] = useState(null); // nome do usuário logado
  const [perfil, setPerfil] = useState(null);   // 'ADM' | 'GER' | 'VENDA'
  const [loginForm, setLoginForm] = useState({ login: '', senha: '' });

  const [telaAtiva, setTelaAtiva] = useState('login');
  // 'login' | 'dashboard' | 'vendedor' | 'historico' | 'inventario' | 'produtos' | 'promissorias' | 'usuarios'

  // ===== Filtros globais (Dashboard / Histórico) =====
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const [filtroLocal, setFiltroLocal] = useState(''); // Inventário: '' | 'DEPOSITO' | 'LOJA'

  // ===== ESTADOS PRINCIPAIS =====
  const [produtos, setProdutos] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);

  const [estoque, setEstoque] = useState([]);
  const [carregandoEstoque, setCarregandoEstoque] = useState(true);

  const [lancamentos, setLancamentos] = useState([]);
  const [carregandoLancamentos, setCarregandoLancamentos] = useState(true);

  // Usuários (agora vindos do Supabase, mas com campo "senha" para o login)
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);

  // Promissórias (Supabase)
  const [promissorias, setPromissorias] = useState(defaultPromissorias);
  const [carregandoPromissorias, setCarregandoPromissorias] = useState(true);

  // ===============================
  // CARREGAR PRODUTOS DO SUPABASE
  // ===============================
  useEffect(() => {
    async function carregarProdutos() {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .order('nome', { ascending: true });

        if (error) {
          console.error('Erro ao carregar produtos do Supabase:', error);
          return;
        }

        const lista = (data || []).map((p) => ({
          codProduto: p.cod_produto,
          nome: p.nome,
          fornecedor: p.fornecedor || '',
          estoqueMinimo: p.estoque_minimo || 0,
          valorUnitario: Number(p.valor_unitario || 0),
          fotoUrl: p.foto_url || '',
        }));

        setProdutos(lista);
      } catch (e) {
        console.error('Erro inesperado ao carregar produtos:', e);
      } finally {
        setCarregandoProdutos(false);
      }
    }

    carregarProdutos();
  }, []);

  // ===============================
  // CARREGAR ESTOQUE DO SUPABASE
  // ===============================
  useEffect(() => {
    async function carregarEstoque() {
      try {
        const { data, error } = await supabase.from('estoque').select('*');

        if (error) {
          console.error('Erro ao carregar estoque do Supabase:', error);
          return;
        }

        const lista = (data || []).map((e) => ({
          codProduto: e.cod_produto,
          produto: e.produto || '',
          fornecedor: e.fornecedor || '',
          local: e.local,
          qtde: e.qtde || 0,
          dataEntrada: e.data_entrada || '',
        }));

        setEstoque(lista);
      } catch (e) {
        console.error('Erro inesperado ao carregar estoque:', e);
      } finally {
        setCarregandoEstoque(false);
      }
    }

    carregarEstoque();
  }, []);

  // ===============================
  // SINCRONIZAR ESTOQUE -> SUPABASE
  // ===============================
  useEffect(() => {
    async function salvarEstoqueNaNuvem() {
      try {
        const payload = estoque.map((e) => ({
          cod_produto: e.codProduto,
          produto: e.produto || null,
          fornecedor: e.fornecedor || null,
          local: e.local,
          qtde: e.qtde || 0,
          data_entrada: e.dataEntrada || null,
        }));

        // Estratégia simples: apaga tudo e grava de novo
        const { error: delError } = await supabase
          .from('estoque')
          .delete()
          .neq('id', 0);

        if (delError) {
          console.error('Erro ao limpar tabela de estoque no Supabase:', delError);
          return;
        }

        if (payload.length > 0) {
          const { error: insError } = await supabase
            .from('estoque')
            .insert(payload);

          if (insError) {
            console.error('Erro ao inserir estoque no Supabase:', insError);
          }
        }
      } catch (e) {
        console.error('Erro inesperado ao salvar estoque na nuvem:', e);
      }
    }

    if (!carregandoEstoque) {
      salvarEstoqueNaNuvem();
    }
  }, [estoque, carregandoEstoque]);

  // ===============================
  // CARREGAR LANÇAMENTOS
  // ===============================
  useEffect(() => {
    async function carregarLancamentos() {
      try {
        const { data, error } = await supabase
          .from('lancamentos')
          .select('*')
          .order('id_lancamento', { ascending: true });

        if (error) {
          console.error('Erro ao carregar lançamentos:', error);
          return;
        }

        const lista = (data || []).map((l) => ({
          id: l.id_lancamento,
          data: l.data,
          tipo: l.tipo,
          fornecedor: l.fornecedor,
          codProduto: l.cod_produto,
          produto: l.produto,
          qtde: Number(l.qtde || 0),
          valorBruto: Number(l.valor_bruto || 0),
          desconto: Number(l.desconto || 0),
          juros: Number(l.juros || 0),
          valorLiq: Number(l.valor_liq || 0),
          valorUnitario: Number(l.valor_unitario || 0),
          local: l.local,
          forma: l.forma,
          nrVenda: l.nr_venda,
          cliente: l.cliente,
          email: l.email,
          telefone: l.telefone,
          parcelas: l.parcelas,
          inicioPagamento: l.inicio_pagto,
          vendedor: l.vendedor,
          statusRecb: l.status_recb,
        }));

        setLancamentos(lista);
      } catch (e) {
        console.error('Erro inesperado ao carregar lançamentos:', e);
      } finally {
        setCarregandoLancamentos(false);
      }
    }

    carregarLancamentos();
  }, []);

  // ===============================
  // CARREGAR USUÁRIOS (COM SENHA)
  // ===============================
  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, login, nome, perfil, senha_hash')
          .order('id', { ascending: true });

        if (error) {
          console.error('Erro ao carregar usuários do Supabase:', error);
          // fallback: usa apenas os default locais
          setUsuarios(defaultUsuarios);
          return;
        }

        if (!data || data.length === 0) {
          // Se a tabela estiver vazia, insere os usuários padrão
          const payload = defaultUsuarios.map((u) => ({
            login: u.login,
            nome: u.nome,
            perfil: u.perfil,
            senha_hash: u.senha, // salvando em texto por enquanto
          }));

          const { data: inseridos, error: insError } = await supabase
            .from('usuarios')
            .insert(payload)
            .select('id, login, nome, perfil, senha_hash');

          if (insError) {
            console.error('Erro ao inserir usuários padrão:', insError);
            setUsuarios(defaultUsuarios);
          } else {
            const mapeados = inseridos.map((u) => ({
              id: u.id,
              login: u.login,
              nome: u.nome,
              perfil: u.perfil,
              senha: u.senha_hash,
            }));
            setUsuarios(mapeados);
          }
        } else {
          // já existem usuários; mapeia senha_hash -> senha
          const mapeados = data.map((u) => ({
            id: u.id,
            login: u.login,
            nome: u.nome,
            perfil: u.perfil,
            senha: u.senha_hash || '',
          }));
          setUsuarios(mapeados);
        }
      } catch (e) {
        console.error('Erro inesperado ao carregar usuários:', e);
        setUsuarios(defaultUsuarios);
      } finally {
        setCarregandoUsuarios(false);
      }
    }

    carregarUsuarios();
  }, []);

  // ===============================
  // CARREGAR PROMISSÓRIAS
  // ===============================
  useEffect(() => {
    async function carregarPromissorias() {
      try {
        const { data, error } = await supabase
          .from('promissorias')
          .select(
            'id, nr_venda, cliente, email, valor, data_inicio, parcelas, parcelas_atra, status, selecionado',
          )
          .order('id', { ascending: true });

        if (error) {
          console.error('Erro ao carregar promissórias do Supabase:', error);
          setPromissorias([]);
          return;
        }

        const lista = (data || []).map((p) => ({
          id: p.id,
          nrVenda: p.nr_venda,
          cliente: p.cliente,
          email: p.email,
          valor: Number(p.valor || 0),
          dataInicio: p.data_inicio,
          parcelas: p.parcelas || 0,
          parcelasAtrasadas: p.parcelas_atra || 0,
          status: p.status || 'ABERTO',
          selecionado: !!p.selecionado,
        }));

        setPromissorias(lista);
      } catch (e) {
        console.error('Erro inesperado ao carregar promissórias:', e);
        setPromissorias([]);
      } finally {
        setCarregandoPromissorias(false);
      }
    }

    carregarPromissorias();
  }, []);

  // ===============================
  // HELPERS GERAIS
  // ===============================
  const handleLogin = () => {
    const usuarioEncontrado = usuarios.find(
      (u) =>
        u.login.toLowerCase() === loginForm.login.toLowerCase() &&
        u.senha === loginForm.senha,
    );

    if (usuarioEncontrado) {
      setUsuario(usuarioEncontrado.nome);
      setPerfil(usuarioEncontrado.perfil);

      if (usuarioEncontrado.perfil === 'VENDA') {
        setTelaAtiva('vendedor');
      } else {
        setTelaAtiva('dashboard');
      }
    } else {
      alert('Usuário ou senha inválidos');
    }
  };

  const handleLogout = () => {
    setUsuario(null);
    setPerfil(null);
    setTelaAtiva('login');
  };

  const formatarReal = (valor) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);

  const formatarDataBR = (dataStr) => {
    if (!dataStr) return '';
    const d = new Date(dataStr);
    if (Number.isNaN(d.getTime())) return dataStr;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const calcularInicioPgtoCredito = (dataVendaStr) => {
    if (!dataVendaStr) return '';
    const d = new Date(dataVendaStr);
    if (Number.isNaN(d.getTime())) return '';
    const ano = d.getFullYear();
    const mes = d.getMonth(); // 0-based
    const proximoMesDia5 = new Date(ano, mes + 1, 5);
    return proximoMesDia5.toISOString().split('T')[0];
  };

  const gerarNumeroVenda = (dataVendaStr) => {
    if (!dataVendaStr) return '';
    const d = new Date(dataVendaStr);
    if (Number.isNaN(d.getTime())) return '';

    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano2 = String(d.getFullYear()).slice(-2);
    const prefixo = `${dia}/${mes}/${ano2}`;

    const qtdMesmoDia = lancamentos.filter(
      (l) => l.tipo === 'VENDA' && l.data === dataVendaStr,
    ).length;

    const sequencial = qtdMesmoDia + 1;
    return `${prefixo}-${sequencial}`;
  };

  // ===== Estoque: aplicar movimentos (COMPRA / REPOSICAO / VENDA / DEVOLUCAO) =====
  const aplicarMovimentoEstoque = (lanc) => {
    if (!lanc.codProduto || !lanc.qtde) return;

    setEstoque((atual) => {
      const copia = [...atual];

      const encontrar = (cod, local) =>
        copia.find((i) => i.codProduto === cod && i.local === local);

      const garantir = (cod, produto, fornecedor, local) => {
        let item = encontrar(cod, local);
        if (!item) {
          item = {
            codProduto: cod,
            produto: produto || '',
            fornecedor: fornecedor || '',
            local,
            qtde: 0,
            dataEntrada: '',
          };
          copia.push(item);
        }
        return item;
      };

      const dataEntrada = lanc.data || new Date().toISOString().split('T')[0];

      switch (lanc.tipo) {
        case 'COMPRA': {
          const dep = garantir(
            lanc.codProduto,
            lanc.produto,
            lanc.fornecedor,
            'DEPOSITO',
          );
          dep.qtde += lanc.qtde;
          dep.dataEntrada = dataEntrada;
          break;
        }
        case 'REPOSICAO': {
          const dep = garantir(
            lanc.codProduto,
            lanc.produto,
            lanc.fornecedor,
            'DEPOSITO',
          );
          const loja = garantir(
            lanc.codProduto,
            lanc.produto,
            lanc.fornecedor,
            'LOJA',
          );
          dep.qtde = Math.max(0, dep.qtde - lanc.qtde);
          loja.qtde += lanc.qtde;
          loja.dataEntrada = dataEntrada;
          break;
        }
        case 'VENDA': {
          const loja = garantir(
            lanc.codProduto,
            lanc.produto,
            lanc.fornecedor,
            'LOJA',
          );
          loja.qtde = Math.max(0, loja.qtde - lanc.qtde);
          break;
        }
        case 'DEVOLUCAO': {
          const dep = garantir(
            lanc.codProduto,
            lanc.produto,
            lanc.fornecedor,
            'DEPOSITO',
          );
          dep.qtde += lanc.qtde;
          dep.dataEntrada = dataEntrada;
          break;
        }
        default:
          break;
      }

      return copia;
    });
  };

  // ===== Cálculo de métricas (Dashboard) =====
  const calcularMetricas = () => {
    const parseData = (d) => (d ? new Date(d) : null);
    const di = filtroDataInicio ? parseData(filtroDataInicio) : null;
    const df = filtroDataFim ? parseData(filtroDataFim) : null;

    const dentroPeriodo = (dataStr) => {
      if (!dataStr) return true;
      const d = new Date(dataStr);
      if (di && d < di) return false;
      if (df && d > df) return false;
      return true;
    };

    const lancFiltrados = lancamentos.filter((l) => dentroPeriodo(l.data));

    const vendas = lancFiltrados.filter((l) => l.tipo === 'VENDA');
    const compras = lancFiltrados.filter((l) => l.tipo === 'COMPRA');
    const despesasOper = lancFiltrados.filter((l) => l.tipo === 'DESPESA_OPER');
    const doacoes = lancFiltrados.filter((l) => l.tipo === 'DOACAO');

    const receitaBruta = vendas.reduce((s, v) => s + (v.valorBruto || 0), 0);
    const descontos = vendas.reduce((s, v) => s + (v.desconto || 0), 0);
    const juros = vendas.reduce((s, v) => s + (v.juros || 0), 0);
    const despesasOp = despesasOper.reduce((s, d) => s + (d.valorLiq || 0), 0);
    const totalDoacoes = doacoes.reduce((s, d) => s + (d.valorLiq || 0), 0);
    const comprasValor = compras.reduce((s, c) => s + (c.valorLiq || 0), 0);

    const inadimplencia = vendas
      .filter((v) => v.statusRecb === 'INADIMPLENTE')
      .reduce((s, v) => s + (v.valorLiq || 0), 0);

    const valoresAReceber = vendas
      .filter(
        (v) =>
          ['PROMISSORIA', 'CREDITO'].includes((v.forma || '').toUpperCase()) &&
          v.statusRecb !== 'RECEBIDO',
      )
      .reduce((s, v) => s + (v.valorLiq || 0), 0);

    const receitaLiquida = receitaBruta - descontos - despesasOp;
    const qtdeProdutosVendidos = vendas.reduce((s, v) => s + (v.qtde || 0), 0);

    const vendasPorForma = {};
    vendas.forEach((v) => {
      const f = v.forma || 'OUTRO';
      if (!vendasPorForma[f]) vendasPorForma[f] = { valor: 0, qtd: 0 };
      vendasPorForma[f].valor += v.valorLiq || 0;
      vendasPorForma[f].qtd += 1;
    });

    const vendasPorVendedor = {};
    vendas.forEach((v) => {
      const vend = v.vendedor || 'Sem vendedor';
      if (!vendasPorVendedor[vend]) vendasPorVendedor[vend] = { valor: 0, qtd: 0 };
      vendasPorVendedor[vend].valor += v.valorLiq || 0;
      vendasPorVendedor[vend].qtd += v.qtde || 0;
    });

    let melhorVendedor = null;
    Object.keys(vendasPorVendedor).forEach((nome) => {
      const v = vendasPorVendedor[nome];
      if (!melhorVendedor || v.valor > melhorVendedor.valor) {
        melhorVendedor = { nome, ...v };
      }
    });

    const vendasPorNr = {};
    vendas.forEach((v) => {
      if (!v.nrVenda) return;
      if (!vendasPorNr[v.nrVenda]) {
        vendasPorNr[v.nrVenda] = {
          nrVenda: v.nrVenda,
          cliente: v.cliente || '',
          valor: 0,
          qtde: 0,
        };
      }
      vendasPorNr[v.nrVenda].valor += v.valorLiq || 0;
      vendasPorNr[v.nrVenda].qtde += v.qtde || 0;
    });

    const top3Vendas = Object.values(vendasPorNr)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 3);

    const fornecAgg = {};
    compras.forEach((c) => {
      const f = c.fornecedor || 'Sem fornecedor';
      if (!fornecAgg[f]) fornecAgg[f] = { valor: 0, qtde: 0 };
      fornecAgg[f].valor += c.valorLiq || 0;
      fornecAgg[f].qtde += c.qtde || 0;
    });

    const listaFornec = Object.entries(fornecAgg).map(([nome, dados]) => ({
      nome,
      ...dados,
    }));

    const top3FornecedoresValor = [...listaFornec]
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 3);

    const top3FornecedoresQtde = [...listaFornec]
      .sort((a, b) => b.qtde - a.qtde)
      .slice(0, 3);

    return {
      receitaBruta,
      receitaLiquida,
      descontos,
      despesasOp,
      inadimplencia,
      totalDoacoes,
      qtdeProdutosVendidos,
      vendasPorForma,
      vendasPorVendedor,
      top3Vendas,
      juros,
      valoresAReceber,
      comprasValor,
      melhorVendedor,
      top3FornecedoresValor,
      top3FornecedoresQtde,
    };
  };

  const metricas = calcularMetricas();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    // ========================================================================
  // TELA DE LOGIN
  // ========================================================================
  const TelaLogin = () => {
    const handleSubmit = (e) => {
      e.preventDefault();
      handleLogin();
    };

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#025302',
          fontFamily: 'Arial, sans-serif',
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            width: '100%',
            maxWidth: '420px',
          }}
        >
          {/* LOGO */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'center',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              }}
            >
              <img
                src="/logo-wolves.png"
                alt="Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '4px' }}>
              Sistema da Loja
            </h1>
            <p style={{ fontSize: '13px', opacity: 1 }}>
              Acesso restrito a administradores, gerentes e vendedores
            </p>
          </div>

          {/* CAIXA DE LOGIN */}
          <div
            style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
              width: '100%',
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: '#111827',
                  }}
                >
                  Usuário
                </label>
                <input
                  // autoFocus removido para não roubar o foco da senha
                  type="text"
                  value={loginForm.login}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, login: e.target.value }))
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                  }}
                  placeholder="Digite seu usuário"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: '#111827',
                  }}
                >
                  Senha
                </label>
                <input
                  type="password"
                  value={loginForm.senha}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, senha: e.target.value }))
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                  }}
                  placeholder="Digite sua senha"
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // ========================================================================
  // MENU SUPERIOR
  // ========================================================================
  const MenuNavegacao = () => {
    if (!perfil) return null;

    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <nav
        style={{
          ...appStyle,
          backgroundColor: '#025302',
          color: '#ffffff',
        }}
        className="shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
          {/* LOGO + NOME CENTRALIZADOS */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
                <img
                  src="/logo-wolves.png"
                  alt="Logo da Loja"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-lg font-extrabold tracking-wide">
                Sistema da Loja
              </div>
            </div>
          </div>

          {/* BOTÕES CENTRALIZADOS */}
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap gap-2 bg-green-900/80 border border-green-950 rounded-2xl px-4 py-3">
              {(perfil === 'ADM' || perfil === 'GER') && (
                <>
                  <button
                    onClick={() => setTelaAtiva('dashboard')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold ${
                      telaAtiva === 'dashboard'
                        ? 'bg-white text-green-900'
                        : 'bg-transparent border border-white/40 hover:bg-white/10'
                    }`}
                  >
                    Painel
                  </button>

                  <button
                    onClick={() => setTelaAtiva('historico')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold ${
                      telaAtiva === 'historico'
                        ? 'bg-white text-green-900'
                        : 'bg-transparent border border-white/40 hover:bg-white/10'
                    }`}
                  >
                    Histórico
                  </button>

                  <button
                    onClick={() => setTelaAtiva('inventario')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold ${
                      telaAtiva === 'inventario'
                        ? 'bg-white text-green-900'
                        : 'bg-transparent border border-white/40 hover:bg-white/10'
                    }`}
                  >
                    Inventário
                  </button>

                  <button
                    onClick={() => setTelaAtiva('produtos')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold ${
                      telaAtiva === 'produtos'
                        ? 'bg-white text-green-900'
                        : 'bg-transparent border border-white/40 hover:bg-white/10'
                    }`}
                  >
                    Produtos / Compras
                  </button>

                  <button
                    onClick={() => setTelaAtiva('promissorias')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold ${
                      telaAtiva === 'promissorias'
                        ? 'bg-white text-green-900'
                        : 'bg-transparent border border-white/40 hover:bg-white/10'
                    }`}
                  >
                    Promissórias
                  </button>

                  {perfil === 'ADM' && (
                    <button
                      onClick={() => setTelaAtiva('usuarios')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold ${
                        telaAtiva === 'usuarios'
                          ? 'bg-white text-green-900'
                          : 'bg-transparent border border-white/40 hover:bg-white/10'
                      }`}
                    >
                      Usuários
                    </button>
                  )}
                </>
              )}

              {/* Lançamentos – todos os perfis */}
              <button
                onClick={() => setTelaAtiva('vendedor')}
                className={`px-3 py-2 rounded-lg text-xs font-bold ${
                  telaAtiva === 'vendedor'
                    ? 'bg-white text-green-900'
                    : 'bg-transparent border border-white/40 hover:bg-white/10'
                }`}
              >
                Lançamentos
              </button>
            </div>
          </div>

          {/* DATA + USUÁRIO + SAIR */}
          <div className="flex justify-end items-center gap-3 text-xs font-semibold">
            <div className="text-right leading-tight">
              <div>{usuario}</div>
              <div>Perfil: {perfil}</div>
              <div>{dataFormatada}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-xs font-bold"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
    );
  };

  // ========================================================================
  // DASHBOARD
  // ========================================================================
  const TelaDashboard = () => {
    const montarSerieMensal = (filtroLanc, campoValor, usarQtde = false) => {
      const parseData = (d) => (d ? new Date(d) : null);
      const di = filtroDataInicio ? parseData(filtroDataInicio) : null;
      const df = filtroDataFim ? parseData(filtroDataFim) : null;

      const dentroPeriodo = (dataStr) => {
        if (!dataStr) return false;
        const d = new Date(dataStr);
        if (di && d < di) return false;
        if (df && d > df) return false;
        return true;
      };

      const mapa = {};

      lancamentos
        .filter((l) => filtroLanc(l) && dentroPeriodo(l.data))
        .forEach((l) => {
          const d = new Date(l.data);
          const mes = String(d.getMonth() + 1).padStart(2, '0');
          const ano = d.getFullYear();
          const chave = `${mes}/${ano}`;

          if (!mapa[chave]) mapa[chave] = 0;

          if (usarQtde) {
            mapa[chave] += l.qtde || 0;
          } else if (campoValor) {
            mapa[chave] += l[campoValor] || 0;
          }
        });

      return Object.entries(mapa)
        .map(([mes, valor]) => {
          const [m, a] = mes.split('/');
          return {
            mes,
            valor,
            _ordem: new Date(Number(a), Number(m) - 1, 1).getTime(),
          };
        })
        .sort((a, b) => a._ordem - b._ordem);
    };

    const dadosReceitaBrutaMes = montarSerieMensal(
      (l) => l.tipo === 'VENDA',
      'valorBruto',
    );
    const dadosReceitaLiquidaMes = montarSerieMensal(
      (l) => l.tipo === 'VENDA',
      'valorLiq',
    );
    const dadosDespesasOperMes = montarSerieMensal(
      (l) => l.tipo === 'DESPESA_OPER',
      'valorLiq',
    );
    const dadosValoresReceberMes = montarSerieMensal(
      (l) =>
        l.tipo === 'VENDA' &&
        ['PROMISSORIA', 'CREDITO'].includes((l.forma || '').toUpperCase()) &&
        l.statusRecb !== 'RECEBIDO',
      'valorLiq',
    );

    const dadosGraficoFormas = Object.keys(metricas.vendasPorForma).map(
      (forma) => ({
        name: forma,
        value: metricas.vendasPorForma[forma].valor,
        qtd: metricas.vendasPorForma[forma].qtd,
      }),
    );

    const dadosGraficoVendedores = Object.keys(metricas.vendasPorVendedor).map(
      (vend) => ({
        name: vend,
        valor: metricas.vendasPorVendedor[vend].valor,
        qtd: metricas.vendasPorVendedor[vend].qtd,
      }),
    );

    const MiniLineChart = ({ data, formato = 'dinheiro' }) => (
      <div className="mt-4 bg-white/10 rounded-xl px-3 py-2" style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff40" />
            <XAxis dataKey="mes" tick={{ fill: '#ffffff', fontSize: 10 }} />
            <YAxis tick={{ fill: '#ffffff', fontSize: 10 }} />
            <Tooltip
              formatter={(v) =>
                formato === 'dinheiro'
                  ? formatarReal(v)
                  : formato === 'qtde'
                  ? `${v} un.`
                  : v
              }
              labelFormatter={(l) => `Mês: ${l}`}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#ffffff"
              strokeWidth={2}
              dot={{ r: 3, stroke: '#ffffff', fill: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );

    return (
      <div className="p-6 space-y-6" style={appStyle}>
        {/* Faixa de Seleção de Período */}
        <div
          className="rounded-lg shadow p-6 mb-2"
          style={{ backgroundColor: '#013801', color: '#ffffff' }}
        >
          <h2 className="text-2xl font-bold mb-4">Selecione o Período</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-1">Data Inicial</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ backgroundColor: '#ffffff', color: '#111827' }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Data Final</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ backgroundColor: '#ffffff', color: '#111827' }}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltroDataInicio('');
                  setFiltroDataFim('');
                }}
                className="w-full font-semibold py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#013801',
                }}
              >
                Limpar Datas
              </button>
            </div>
          </div>
        </div>

        {/* Cards Principais */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          {/* Receita Bruta */}
          <div
            style={{
              background: 'linear-gradient(to bottom right, #16a34a, #15803d)',
              borderRadius: '12px',
              padding: '20px',
              color: '#ffffff',
              boxShadow: '0 10px 15px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <div>
                <div className="text-xs uppercase opacity-80 font-semibold">
                  Receita Bruta
                </div>
                <div className="text-2xl font-extrabold">
                  {formatarReal(metricas.receitaBruta)}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <MiniLineChart data={dadosReceitaBrutaMes} formato="dinheiro" />
          </div>

          {/* Receita Líquida */}
          <div
            style={{
              background: 'linear-gradient(to bottom right, #0ea5e9, #0369a1)',
              borderRadius: '12px',
              padding: '20px',
              color: '#ffffff',
              boxShadow: '0 10px 15px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <div>
                <div className="text-xs uppercase opacity-80 font-semibold">
                  Receita Líquida
                </div>
                <div className="text-2xl font-extrabold">
                  {formatarReal(metricas.receitaLiquida)}
                </div>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <MiniLineChart data={dadosReceitaLiquidaMes} formato="dinheiro" />
          </div>

          {/* Despesas Operacionais */}
          <div
            style={{
              background: 'linear-gradient(to bottom right, #f97316, #c2410c)',
              borderRadius: '12px',
              padding: '20px',
              color: '#ffffff',
              boxShadow: '0 10px 15px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <div>
                <div className="text-xs uppercase opacity-80 font-semibold">
                  Despesas Operacionais
                </div>
                <div className="text-2xl font-extrabold">
                  {formatarReal(metricas.despesasOp)}
                </div>
              </div>
              <AlertCircle className="w-8 h-8 opacity-80" />
            </div>
            <MiniLineChart data={dadosDespesasOperMes} formato="dinheiro" />
          </div>

          {/* Valores a Receber */}
          <div
            style={{
              background: 'linear-gradient(to bottom right, #a855f7, #6d28d9)',
              borderRadius: '12px',
              padding: '20px',
              color: '#ffffff',
              boxShadow: '0 10px 15px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <div>
                <div className="text-xs uppercase opacity-80 font-semibold">
                  Valores a Receber
                </div>
                <div className="text-2xl font-extrabold">
                  {formatarReal(metricas.valoresAReceber)}
                </div>
              </div>
              <Package className="w-8 h-8 opacity-80" />
            </div>
            <MiniLineChart data={dadosValoresReceberMes} formato="dinheiro" />
          </div>
        </div>

        {/* Gráficos adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendas por Forma de Pagamento */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">
              Vendas por Forma de Pagamento
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={metricas.vendasPorForma && dadosGraficoFormas}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label={(entry) => entry.name}
                  >
                    {dadosGraficoFormas.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name, props) => [
                      formatarReal(v),
                      `${props.payload.name} (${props.payload.qtd} vendas)`,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vendas por Vendedor */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">
              Vendas por Vendedor (Valor Líquido)
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={dadosGraficoVendedores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatarReal(v)} />
                  <Bar dataKey="valor">
                    {dadosGraficoVendedores.map((entry, index) => (
                      <Cell
                        key={`cell-vend-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // ======== FIM DA PARTE 1/4 ========
    // ========================================================================
  // TELA VENDEDOR (LANÇAMENTOS DE VENDAS)
  // ========================================================================
  const TelaVendedor = () => {
    const [novaVenda, setNovaVenda] = useState({
      data: new Date().toISOString().split('T')[0],
      cliente: '',
      email: '',
      telefone: '',
      produto: '',
      codProduto: '',
      fornecedor: '',
      qtde: 1,
      valorBruto: 0,
      desconto: 0,
      juros: 0,
      valorLiq: 0,
      forma: 'PIX',
      nrVenda: '',
      local: 'LOJA',
      parcelas: 1,
      inicioPagamento: '',
    });

    // Lista de produtos disponíveis no ESTOQUE (únicos por código)
    const produtosEstoque = Array.from(
      new Map(
        estoque.map((e) => [
          e.codProduto,
          {
            codProduto: e.codProduto,
            produto: e.produto,
          },
        ]),
      ).values(),
    );

    const encontrarInfoProduto = (cod, nome) => {
      let item =
        (cod &&
          (estoque.find(
            (e) => e.codProduto === cod && e.local === 'LOJA',
          ) ||
            estoque.find((e) => e.codProduto === cod))) ||
        null;

      if (!item && nome) {
        item =
          estoque.find(
            (e) => e.produto === nome && e.local === 'LOJA',
          ) || estoque.find((e) => e.produto === nome);
      }

      if (!item) return null;

      const prodCad = produtos.find((p) => p.codProduto === item.codProduto);
      const valorUnitario =
        prodCad && typeof prodCad.valorUnitario === 'number'
          ? prodCad.valorUnitario
          : 0;

      return {
        codProduto: item.codProduto,
        produto: item.produto,
        fornecedor: item.fornecedor,
        valorUnitario,
        fotoUrl: prodCad?.fotoUrl || '',
      };
    };

    const calcularValorLiquido = (vendaBase) => {
      const { valorBruto, desconto, juros } = vendaBase;
      return (Number(valorBruto) || 0) - (Number(desconto) || 0) + (Number(juros) || 0);
    };

    const atualizarVendaComProduto = (info) => {
      setNovaVenda((anterior) => {
        const atual = { ...anterior };
        atual.codProduto = info.codProduto;
        atual.produto = info.produto;
        atual.fornecedor = info.fornecedor || '';

        const qtdeNum = Number(atual.qtde) || 0;
        if (info.valorUnitario && qtdeNum > 0) {
          atual.valorBruto = info.valorUnitario * qtdeNum;
        }

        atual.valorLiq = calcularValorLiquido(atual);

        if (atual.data) {
          atual.nrVenda = gerarNumeroVenda(atual.data);
        }

        if (atual.forma === 'CREDITO') {
          atual.inicioPagamento = calcularInicioPgtoCredito(atual.data);
        }

        return atual;
      });
    };

    const selecionarProdutoPorCodigo = (cod) => {
      const info = encontrarInfoProduto(cod, null);
      if (info) {
        atualizarVendaComProduto(info);
      } else {
        handleChange('codProduto', cod, true);
      }
    };

    const selecionarProdutoPorNome = (nome) => {
      const info = encontrarInfoProduto(null, nome);
      if (info) {
        atualizarVendaComProduto(info);
      } else {
        handleChange('produto', nome, true);
      }
    };

    const handleChange = (campo, valor, pularProduto = false) => {
      setNovaVenda((anterior) => {
        let atual = { ...anterior, [campo]: valor };

        // Data → recalcula número da venda e início de pagamento (crédito)
        if (campo === 'data') {
          atual.nrVenda = gerarNumeroVenda(atual.data);

          if (atual.forma === 'CREDITO') {
            atual.inicioPagamento = calcularInicioPgtoCredito(atual.data);
          }
        }

        // Forma de pagamento → controla início de pagamento
        if (campo === 'forma') {
          if (valor === 'CREDITO') {
            atual.inicioPagamento = calcularInicioPgtoCredito(atual.data);
          } else if (valor === 'PROMISSORIA') {
            atual.inicioPagamento = '';
          } else {
            atual.inicioPagamento = '';
          }
        }

        // Quantidade → recalcula valor bruto (valor unitário x qtde)
        if (campo === 'qtde') {
          const infoProd = encontrarInfoProduto(atual.codProduto, atual.produto);
          const qtdeNum = Number(valor) || 0;
          if (infoProd && infoProd.valorUnitario && qtdeNum > 0) {
            atual.valorBruto = infoProd.valorUnitario * qtdeNum;
          }
        }

        // Desconto / juros → só mexem no valor líquido
        if (['desconto', 'juros'].includes(campo)) {
          // nada no valorBruto, apenas recalcular valorLiq
        }

        // Recalcular valor bruto quando mudar produto/código
        if (!pularProduto && (campo === 'codProduto' || campo === 'produto')) {
          const info = encontrarInfoProduto(
            campo === 'codProduto' ? valor : atual.codProduto,
            campo === 'produto' ? valor : atual.produto,
          );
          if (info) {
            atual.codProduto = info.codProduto;
            atual.produto = info.produto;
            atual.fornecedor = info.fornecedor || atual.fornecedor;
            const qtdeNum = Number(atual.qtde) || 0;
            if (info.valorUnitario && qtdeNum > 0) {
              atual.valorBruto = info.valorUnitario * qtdeNum;
            }
          }
        }

        // Valor líquido sempre recalculado por último
        atual.valorLiq = calcularValorLiquido(atual);

        return atual;
      });
    };

    const registrarVenda = async () => {
      if (!novaVenda.codProduto || !novaVenda.cliente) {
        alert('Informe código do produto e cliente.');
        return;
      }

      const lancVenda = {
        ...novaVenda,
        tipo: 'VENDA',
        qtde: Number(novaVenda.qtde) || 0,
        valorBruto: Number(novaVenda.valorBruto) || 0,
        desconto: Number(novaVenda.desconto) || 0,
        juros: Number(novaVenda.juros) || 0,
        valorLiq: calcularValorLiquido(novaVenda),
        vendedor: usuario || 'Vendedor',
      };

      if (!lancVenda.nrVenda) {
        lancVenda.nrVenda = gerarNumeroVenda(lancVenda.data);
      }

      // 1) Atualiza lançamentos em memória
      setLancamentos((atual) => [...atual, lancVenda]);

      // 2) Movimenta estoque (LOJA)
      aplicarMovimentoEstoque({
        tipo: 'VENDA',
        codProduto: lancVenda.codProduto,
        produto: lancVenda.produto,
        fornecedor: lancVenda.fornecedor,
        qtde: lancVenda.qtde,
        data: lancVenda.data,
      });

      // 3) Se for promissória, registra também
      if (lancVenda.forma.toUpperCase() === 'PROMISSORIA') {
        const promBase = {
          nrVenda: lancVenda.nrVenda,
          cliente: lancVenda.cliente,
          email: lancVenda.email,
          valor: lancVenda.valorLiq,
          dataInicio: lancVenda.inicioPagamento || lancVenda.data,
          parcelas: lancVenda.parcelas || 1,
          parcelasAtrasadas: 0,
          status: 'ABERTO',
          selecionado: false,
        };

        try {
          const { data: promDb, error: promError } = await supabase
            .from('promissorias')
            .insert({
              nr_venda: promBase.nrVenda,
              cliente: promBase.cliente,
              email: promBase.email,
              valor: promBase.valor,
              data_inicio: promBase.dataInicio,
              parcelas: promBase.parcelas,
              parcelas_atra: promBase.parcelasAtrasadas,
              status: promBase.status,
              selecionado: promBase.selecionado,
            })
            .select(
              'id, nr_venda, cliente, email, valor, data_inicio, parcelas, parcelas_atra, status, selecionado',
            )
            .single();

          if (promError) {
            console.error('Erro ao salvar promissória no Supabase:', promError);
            setPromissorias((lista) => [...lista, promBase]);
          } else {
            const novaProm = {
              id: promDb.id,
              nrVenda: promDb.nr_venda,
              cliente: promDb.cliente,
              email: promDb.email,
              valor: Number(promDb.valor || 0),
              dataInicio: promDb.data_inicio,
              parcelas: promDb.parcelas || 0,
              parcelasAtrasadas: promDb.parcelas_atra || 0,
              status: promDb.status || 'ABERTO',
              selecionado: !!promDb.selecionado,
            };
            setPromissorias((lista) => [...lista, novaProm]);
          }
        } catch (e) {
          console.error('Erro inesperado ao salvar promissória:', e);
          setPromissorias((lista) => [...lista, promBase]);
        }
      }

      // 4) Salvar venda no Supabase (colunas certas)
      try {
        const nrVendaNumero =
          parseInt(
            (lancVenda.nrVenda || '').includes('-')
              ? lancVenda.nrVenda.split('-')[1]
              : lancVenda.nrVenda,
            10,
          ) || null;

        const { error } = await supabase.from('lancamentos').insert({
          data: lancVenda.data,
          tipo: 'VENDA',
          cod_produto: lancVenda.codProduto,
          produto: lancVenda.produto,
          fornecedor: lancVenda.fornecedor,
          qtde: lancVenda.qtde,
          valor_bruto: lancVenda.valorBruto,
          desconto: lancVenda.desconto,
          juros: lancVenda.juros,
          valor_liq: lancVenda.valorLiq,
          forma: lancVenda.forma,
          nr_venda: nrVendaNumero,
          local: 'LOJA',
          parcelas:
            lancVenda.forma.toUpperCase() === 'PROMISSORIA'
              ? lancVenda.parcelas
              : null,
          inicio_pagto: lancVenda.inicioPagamento || null,
          cliente: lancVenda.cliente,
          email: lancVenda.email,
          telefone: lancVenda.telefone,
          vendedor: lancVenda.vendedor,
          status_recb:
            lancVenda.forma.toUpperCase() === 'PROMISSORIA'
              ? 'PENDENTE'
              : 'RECEBIDO',
        });

        if (error) {
          console.error('Erro ao salvar venda no Supabase:', error);
          alert('Venda lançada localmente, mas houve erro ao salvar na nuvem.');
        }
      } catch (e) {
        console.error('Erro inesperado ao salvar venda no Supabase:', e);
        alert('Venda lançada localmente, mas houve erro inesperado na nuvem.');
      }

      alert('Venda registrada com sucesso!');

      setNovaVenda({
        data: new Date().toISOString().split('T')[0],
        cliente: '',
        email: '',
        telefone: '',
        produto: '',
        codProduto: '',
        fornecedor: '',
        qtde: 1,
        valorBruto: 0,
        desconto: 0,
        juros: 0,
        valorLiq: 0,
        forma: 'PIX',
        nrVenda: '',
        local: 'LOJA',
        parcelas: 1,
        inicioPagamento: '',
      });
    };

    // ======= INTERFACE =======
    // Foto do produto selecionado (se houver)
    const infoProdSelecionado =
      novaVenda.codProduto || novaVenda.produto
        ? encontrarInfoProduto(novaVenda.codProduto, novaVenda.produto)
        : null;

    return (
      <div className="p-6 space-y-6" style={appStyle}>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Lançamento de Venda</h2>
          <p className="text-sm text-gray-600 mb-4">
            Preencha os dados da venda. O estoque da <strong>LOJA</strong> será atualizado
            automaticamente.
          </p>

          {/* Linha 1 - Data, Nr Venda, Forma, Parcelas, Início Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">Data</label>
              <input
                type="date"
                value={novaVenda.data}
                onChange={(e) => handleChange('data', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Nr Venda</label>
              <input
                type="text"
                value={novaVenda.nrVenda}
                onChange={(e) => handleChange('nrVenda', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Gerado automaticamente"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Forma de pagamento</label>
              <select
                value={novaVenda.forma}
                onChange={(e) => handleChange('forma', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="PIX">PIX</option>
                <option value="DEBITO">Débito</option>
                <option value="CREDITO">Crédito</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PROMISSORIA">Promissória</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Qtd Parcelas</label>
              <input
                type="number"
                min={1}
                value={novaVenda.parcelas}
                onChange={(e) => handleChange('parcelas', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Início do Pagamento</label>
              <input
                type="date"
                value={novaVenda.inicioPagamento}
                onChange={(e) => handleChange('inicioPagamento', e.target.value)}
                disabled={novaVenda.forma === 'CREDITO'}
                className={`w-full px-3 py-2 border rounded-lg ${
                  novaVenda.forma === 'CREDITO' ? 'bg-gray-100 text-gray-500' : ''
                }`}
              />
              {novaVenda.forma === 'CREDITO' && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Para crédito, o início é calculado para o dia 5 do mês seguinte.
                </p>
              )}
            </div>
          </div>

          {/* Linha 2 - Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">Cliente</label>
              <input
                type="text"
                value={novaVenda.cliente}
                onChange={(e) => handleChange('cliente', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">E-mail</label>
              <input
                type="email"
                value={novaVenda.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Telefone</label>
              <input
                type="text"
                value={novaVenda.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Linha 3 - Produto + foto ao lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 text-sm">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold mb-1">Código Produto</label>
                <select
                  value={novaVenda.codProduto}
                  onChange={(e) => selecionarProdutoPorCodigo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {produtosEstoque.map((p) => (
                    <option key={p.codProduto} value={p.codProduto}>
                      {p.codProduto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Produto</label>
                <select
                  value={novaVenda.produto}
                  onChange={(e) => selecionarProdutoPorNome(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {produtosEstoque.map((p) => (
                    <option key={p.codProduto} value={p.produto}>
                      {p.produto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Fornecedor</label>
                <input
                  type="text"
                  value={novaVenda.fornecedor}
                  onChange={(e) => handleChange('fornecedor', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Quantidade</label>
                <input
                  type="number"
                  min={1}
                  value={novaVenda.qtde}
                  onChange={(e) => handleChange('qtde', Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Foto do produto */}
            <div className="flex flex-col">
              <label className="block font-semibold mb-1">Foto do produto</label>
              <div className="border-4 border-gray-800 rounded-lg w-full aspect-square flex items-center justify-center overflow-hidden bg-gray-50">
                {infoProdSelecionado?.fotoUrl ? (
                  <img
                    src={infoProdSelecionado.fotoUrl}
                    alt="Foto do produto"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-500 text-center px-2">
                    A imagem cadastrada para o produto aparecerá aqui.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Linha 4 - Valores */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">Valor Bruto (R$)</label>
              <input
                type="text"
                disabled
                value={formatarReal(novaVenda.valorBruto)}
                className="w-full px-3 py-2 border rounded-lg bg-gray-100"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Calculado automaticamente: valor unitário do produto × quantidade.
              </p>
            </div>
            <div>
              <label className="block font-semibold mb-1">Desconto (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={novaVenda.desconto}
                onChange={(e) => handleChange('desconto', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Juros (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={novaVenda.juros}
                onChange={(e) => handleChange('juros', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Valor final da venda (R$)
              </label>
              <input
                type="text"
                disabled
                value={formatarReal(calcularValorLiquido(novaVenda))}
                className="w-full px-3 py-2 border rounded-lg bg-gray-100"
              />
            </div>
          </div>

          <button
            onClick={registrarVenda}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Registrar Venda
          </button>
        </div>
      </div>
    );
  };

  // ========================================================================
  // HISTÓRICO DE TRANSAÇÕES
  // ========================================================================
  const TelaHistorico = () => {
    const parseData = (d) => (d ? new Date(d) : null);
    const di = filtroDataInicio ? parseData(filtroDataInicio) : null;
    const df = filtroDataFim ? parseData(filtroDataFim) : null;

    const dentroPeriodo = (dataStr) => {
      if (!dataStr) return true;
      const d = new Date(dataStr);
      if (di && d < di) return false;
      if (df && d > df) return false;
      return true;
    };

    const lancFiltrados = lancamentos
      .filter((l) => dentroPeriodo(l.data))
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    return (
      <div className="p-6 space-y-4" style={appStyle}>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Histórico de Transações</h2>
              <p className="text-sm text-gray-600">
                Todas as vendas, compras, doações e despesas operacionais.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Data Final</label>
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFiltroDataInicio('');
                    setFiltroDataFim('');
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Histórico */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 text-xs md:text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">Data</th>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">Tipo</th>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">
                      Nr Venda
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">
                      Cliente
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">
                      E-mail Cliente
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">
                      Vendedor
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">
                      Produto
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-right">Qtd</th>
                    <th className="px-2 py-2 border-b border-gray-300 text-right">
                      Valor Bruto
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-right">
                      Desconto
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-right">
                      Juros
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-right">
                      Valor Líquido
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">
                      Forma Pgto
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-center">
                      Qtd Parcelas
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">
                      Local
                    </th>
                    <th className="px-2 py-2 border-b border-gray-300 text-left">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lancFiltrados.map((l, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-2 py-1">
                        {l.data ? formatarDataBR(l.data) : ''}
                      </td>
                      <td className="px-2 py-1">{l.tipo}</td>
                      <td className="px-2 py-1">{l.nrVenda || '-'}</td>
                      <td className="px-2 py-1">{l.cliente || '-'}</td>
                      <td className="px-2 py-1">
                        {l.email ? (
                          <span className="text-blue-700 underline">{l.email}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-2 py-1">{l.vendedor || '-'}</td>
                      <td className="px-2 py-1">{l.produto || l.categoria || '-'}</td>
                      <td className="px-2 py-1 text-right">{l.qtde || '-'}</td>
                      <td className="px-2 py-1 text-right">
                        {l.valorBruto != null ? formatarReal(l.valorBruto) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {l.desconto != null ? formatarReal(l.desconto) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {l.juros != null ? formatarReal(l.juros) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {l.valorLiq != null ? formatarReal(l.valorLiq) : '-'}
                      </td>
                      <td className="px-2 py-1">{l.forma || '-'}</td>
                      <td className="px-2 py-1 text-center">
                        {l.parcelas != null ? l.parcelas : '-'}
                      </td>
                      <td className="px-2 py-1">{l.local || '-'}</td>
                      <td className="px-2 py-1">{l.statusRecb || '-'}</td>
                    </tr>
                  ))}
                  {lancFiltrados.length === 0 && (
                    <tr>
                      <td
                        colSpan={16}
                        className="px-2 py-4 text-center text-gray-500 text-xs"
                      >
                        Nenhuma transação encontrada para o período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // ======== FIM DA PARTE 2/4 ========
  // ========================================================================
  // INVENTÁRIO
  // ========================================================================
  const TelaInventario = () => {
    const [filtroDataInv, setFiltroDataInv] = useState('');

    const estoqueFiltrado = filtroLocal
      ? estoque.filter((e) => e.local === filtroLocal)
      : estoque;

    const itensLoja = estoque.filter((e) => e.local === 'LOJA');
    const itensDeposito = estoque.filter((e) => e.local === 'DEPOSITO');

    const totalLoja = itensLoja.reduce((s, i) => s + (i.qtde || 0), 0);
    const totalDeposito = itensDeposito.reduce((s, i) => s + (i.qtde || 0), 0);

    const calcularValorEstoque = (listaItens) =>
      listaItens.reduce((s, item) => {
        const prod = produtos.find((p) => p.codProduto === item.codProduto);
        const valorUnit = prod && prod.valorUnitario ? prod.valorUnitario : 0;
        return s + (item.qtde || 0) * valorUnit;
      }, 0);

    const totalValorLoja = calcularValorEstoque(itensLoja);
    const totalValorDeposito = calcularValorEstoque(itensDeposito);

    const refDate = filtroDataInv ? new Date(filtroDataInv) : new Date();

    const calcularDiasEstoque = (item) => {
      if (!item.dataEntrada) return 0;
      const de = new Date(item.dataEntrada);
      if (Number.isNaN(de.getTime())) return 0;
      const diffMs = refDate - de;
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    };

    const ordenarMaisAntigo = (a, b) => {
      const da = a.dataEntrada ? new Date(a.dataEntrada) : new Date();
      const db = b.dataEntrada ? new Date(b.dataEntrada) : new Date();
      return da - db;
    };

    const ordenarMaisRecente = (a, b) => {
      const da = a.dataEntrada ? new Date(a.dataEntrada) : new Date();
      const db = b.dataEntrada ? new Date(b.dataEntrada) : new Date();
      return db - da;
    };

    const itemMaisAntigoDeposito =
      itensDeposito.length > 0 ? [...itensDeposito].sort(ordenarMaisAntigo)[0] : null;

    const itemMenosTempoLoja =
      itensLoja.length > 0 ? [...itensLoja].sort(ordenarMaisRecente)[0] : null;

    const statusEstoque = (codProduto) => {
      const prod = produtos.find((p) => p.codProduto === codProduto);
      if (!prod || !prod.estoqueMinimo || prod.estoqueMinimo <= 0) {
        return 'NORMAL';
      }
      const totalProduto = estoque
        .filter((e) => e.codProduto === codProduto)
        .reduce((s, e) => s + (e.qtde || 0), 0);
      return totalProduto <= prod.estoqueMinimo ? 'BAIXO' : 'NORMAL';
    };

    return (
      <div className="p-6 space-y-6" style={appStyle}>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Inventário de Estoque</h2>
              <p className="text-sm text-gray-600">
                Acompanhe o que está na loja e no depósito. Os dias em estoque são
                calculados em relação à data de referência abaixo.
              </p>
            </div>
            <div className="flex flex-col md:items-end gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filtroLocal}
                  onChange={(e) => setFiltroLocal(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Todos os locais</option>
                  <option value="LOJA">LOJA</option>
                  <option value="DEPOSITO">DEPÓSITO</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Data de referência
                </label>
                <input
                  type="date"
                  value={filtroDataInv}
                  onChange={(e) => setFiltroDataInv(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Se vazio, usa a data de hoje.
                </p>
              </div>
            </div>
          </div>

          {/* Painéis Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loja */}
            <div
              className="rounded-xl p-4 text-white shadow-md"
              style={{ background: 'linear-gradient(to bottom right, #16a34a, #166534)' }}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-xs uppercase opacity-80 font-semibold">
                    Total na Loja
                  </div>
                  <div className="text-2xl font-extrabold">{totalLoja} un.</div>
                </div>
                <Package className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-xs opacity-90">
                Valor estimado em estoque:
                <span className="font-bold ml-1">{formatarReal(totalValorLoja)}</span>
              </div>
            </div>

            {/* Depósito */}
            <div
              className="rounded-xl p-4 text-white shadow-md"
              style={{ background: 'linear-gradient(to bottom right, #0ea5e9, #0369a1)' }}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-xs uppercase opacity-80 font-semibold">
                    Total no Depósito
                  </div>
                  <div className="text-2xl font-extrabold">{totalDeposito} un.</div>
                </div>
                <Package className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-xs opacity-90">
                Valor estimado em estoque:
                <span className="font-bold ml-1">{formatarReal(totalValorDeposito)}</span>
              </div>
            </div>

            {/* Mais antigo depósito */}
            <div
              className="rounded-xl p-4 text-white shadow-md"
              style={{ background: 'linear-gradient(to bottom right, #f97316, #c2410c)' }}
            >
              <div className="text-xs uppercase opacity-80 font-semibold mb-1">
                Item mais antigo no Depósito
              </div>
              {itemMaisAntigoDeposito ? (
                <>
                  <div className="font-semibold text-sm">{itemMaisAntigoDeposito.produto}</div>
                  <div className="text-xs mt-1">
                    {itemMaisAntigoDeposito.qtde} un. —{' '}
                    {calcularDiasEstoque(itemMaisAntigoDeposito)} dias em estoque
                  </div>
                </>
              ) : (
                <div className="text-xs opacity-80">Nenhum item no depósito.</div>
              )}
            </div>

            {/* Menos tempo loja */}
            <div
              className="rounded-xl p-4 text-white shadow-md"
              style={{ background: 'linear-gradient(to bottom right, #a855f7, #6d28d9)' }}
            >
              <div className="text-xs uppercase opacity-80 font-semibold mb-1">
                Item com menor tempo na Loja
              </div>
              {itemMenosTempoLoja ? (
                <>
                  <div className="font-semibold text-sm">{itemMenosTempoLoja.produto}</div>
                  <div className="text-xs mt-1">
                    {itemMenosTempoLoja.qtde} un. —{' '}
                    {calcularDiasEstoque(itemMenosTempoLoja)} dias em estoque
                  </div>
                </>
              ) : (
                <div className="text-xs opacity-80">Nenhum item na loja.</div>
              )}
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto text-sm">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Produto</th>
                  <th className="px-3 py-2 text-left">Fornecedor</th>
                  <th className="px-3 py-2 text-left">Local</th>
                  <th className="px-3 py-2 text-right">Quantidade</th>
                  <th className="px-3 py-2 text-right">Dias em Estoque</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {estoqueFiltrado.map((item, idx) => {
                  const status = statusEstoque(item.codProduto);
                  const dias = calcularDiasEstoque(item);
                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{item.codProduto}</td>
                      <td className="px-3 py-2">{item.produto}</td>
                      <td className="px-3 py-2">{item.fornecedor}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.local === 'LOJA'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.local}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">{item.qtde}</td>
                      <td className="px-3 py-2 text-right">{dias}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            status === 'BAIXO'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {estoqueFiltrado.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-xs text-gray-500">
                      Nenhum item de estoque cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Dica: você pode imprimir esta tela pelo navegador para registrar o estoque do dia.
          </div>
        </div>
      </div>
    );
  };

  // ========================================================================
  // TELA DE PRODUTOS / COMPRAS
  // ========================================================================
  const TelaProdutos = () => {
    const [produtoEdit, setProdutoEdit] = useState({
      codProduto: '',
      nome: '',
      fornecedor: '',
      estoqueMinimo: 0,
      fotoUrl: '', // agora guarda o base64 da imagem
    });

    // REPOSICAO_DEPOSITO = compra que entra no DEPÓSITO
    // REPOSICAO_LOJA     = transferência DEPÓSITO -> LOJA
    const [tipoTransacao, setTipoTransacao] =
      useState('REPOSICAO_DEPOSITO');

    const [novaCompra, setNovaCompra] = useState({
      data: new Date().toISOString().split('T')[0],
      codProduto: '',
      produto: '',
      fornecedor: '',
      qtde: 1,
      valorTotal: 0,
    });

    // Seleciona produto pelo código, preenchendo nome e fornecedor
    const selecionarProdutoCompra = (cod) => {
      const p = produtos.find((x) => x.codProduto === cod);
      if (p) {
        setNovaCompra((atual) => ({
          ...atual,
          codProduto: p.codProduto,
          produto: p.nome,
          fornecedor: p.fornecedor,
        }));
      } else {
        setNovaCompra((atual) => ({ ...atual, codProduto: cod }));
      }
    };

    // Tratamento de upload de foto (arquivo -> base64)
    const handleFotoChange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        if (typeof base64 === 'string') {
          setProdutoEdit((prev) => ({
            ...prev,
            fotoUrl: base64,
          }));
        }
      };
      reader.readAsDataURL(file);
    };

    // Salvar / atualizar produto no Supabase e refletir no estado local
    const salvarProduto = async () => {
      if (!produtoEdit.codProduto || !produtoEdit.nome) {
        alert('Informe código e nome do produto.');
        return;
      }

      const payload = {
        cod_produto: produtoEdit.codProduto,
        nome: produtoEdit.nome,
        fornecedor: produtoEdit.fornecedor || null,
        estoque_minimo: Number(produtoEdit.estoqueMinimo) || 0,
        foto_url: produtoEdit.fotoUrl || null,
      };

      try {
        const { data, error } = await supabase
          .from('produtos')
          .upsert(payload, { onConflict: 'cod_produto' })
          .select()
          .single();

        if (error) {
          console.error('Erro ao salvar produto no Supabase:', error);
          alert('Erro ao salvar produto no banco. Veja o console (F12).');
          return;
        }

        const novoItem = {
          codProduto: data.cod_produto,
          nome: data.nome,
          fornecedor: data.fornecedor || '',
          estoqueMinimo: data.estoque_minimo || 0,
          valorUnitario: Number(data.valor_unitario || 0),
          fotoUrl: data.foto_url || '',
        };

        setProdutos((atual) => {
          const idx = atual.findIndex(
            (p) => p.codProduto === novoItem.codProduto,
          );
          if (idx >= 0) {
            const copia = [...atual];
            copia[idx] = novoItem;
            return copia;
          }
          return [...atual, novoItem];
        });

        alert('Produto salvo/atualizado com sucesso na nuvem!');

        setProdutoEdit({
          codProduto: '',
          nome: '',
          fornecedor: '',
          estoqueMinimo: 0,
          fotoUrl: '',
        });
      } catch (e) {
        console.error('Erro inesperado em salvarProduto:', e);
        alert('Erro inesperado ao salvar produto.');
      }
    };

    // Registrar compra (entrada em DEPÓSITO) ou transferência para LOJA
    const registrarCompra = async () => {
      if (!novaCompra.codProduto || !novaCompra.qtde) {
        alert('Informe produto e quantidade.');
        return;
      }

      const qtdeNum = Number(novaCompra.qtde) || 0;
      let novoLanc = null;

      if (tipoTransacao === 'REPOSICAO_LOJA') {
        // Movimento interno: Depósito -> Loja (sem valor financeiro)
        novoLanc = {
          data: novaCompra.data,
          tipo: 'REPOSICAO',
          fornecedor: novaCompra.fornecedor,
          codProduto: novaCompra.codProduto,
          produto: novaCompra.produto,
          qtde: qtdeNum,
          valorBruto: 0,
          valorLiq: 0,
          local: 'LOJA',
          forma: 'INTERNO',
        };

        // Atualiza estoque
        aplicarMovimentoEstoque({ ...novoLanc });

        alert('Reposição de LOJA registrada no estoque!');
      } else {
        // COMPRA -> entra no DEPÓSITO
        if (!novaCompra.valorTotal) {
          alert('Informe o valor total da compra.');
          return;
        }

        const valorUnit =
          qtdeNum > 0
            ? Number(novaCompra.valorTotal) / qtdeNum
            : 0;

        novoLanc = {
          data: novaCompra.data,
          tipo: 'COMPRA',
          fornecedor: novaCompra.fornecedor,
          codProduto: novaCompra.codProduto,
          produto: novaCompra.produto,
          qtde: qtdeNum,
          valorBruto: Number(novaCompra.valorTotal),
          valorLiq: Number(novaCompra.valorTotal),
          local: 'DEPOSITO',
          forma: 'PIX',
          valorUnitario: valorUnit,
        };

        // Atualiza estoque (entra no DEPÓSITO)
        aplicarMovimentoEstoque({ ...novoLanc });

        // Atualiza valor unitário do produto em memória
        setProdutos((lista) => {
          const idx = lista.findIndex(
            (p) => p.codProduto === novaCompra.codProduto,
          );
          if (idx >= 0) {
            const copia = [...lista];
            copia[idx] = {
              ...copia[idx],
              valorUnitario: valorUnit,
              fornecedor: novoLanc.fornecedor,
            };
            return copia;
          }
          // Se o produto ainda não existia em produtos
          return [
            ...lista,
            {
              codProduto: novaCompra.codProduto,
              nome: novaCompra.produto,
              fornecedor: novoLanc.fornecedor,
              estoqueMinimo: 0,
              valorUnitario: valorUnit,
              fotoUrl: '',
            },
          ];
        });

        // Também grava o valor unitário no Supabase (tabela produtos)
        try {
          const prodAtual = produtos.find(
            (p) => p.codProduto === novaCompra.codProduto,
          );

          const payloadUpsert = {
            cod_produto: novaCompra.codProduto,
            nome: novaCompra.produto || prodAtual?.nome || null,
            fornecedor:
              novoLanc.fornecedor ||
              prodAtual?.fornecedor ||
              null,
            estoque_minimo: prodAtual?.estoqueMinimo ?? 0,
            valor_unitario: valorUnit,
            foto_url: prodAtual?.fotoUrl || null,
          };

          const { error: erroProd } = await supabase
            .from('produtos')
            .upsert(payloadUpsert, { onConflict: 'cod_produto' });

          if (erroProd) {
            console.error(
              'Erro ao atualizar valor_unitario no Supabase (produtos):',
              erroProd,
            );
          }
        } catch (e) {
          console.error(
            'Erro inesperado ao atualizar valor_unitario (produtos):',
            e,
          );
        }

        alert('Compra registrada e estoque atualizado!');
      }

      // 1) Atualiza lançamentos em memória
      setLancamentos((atual) => [...atual, novoLanc]);

      // 2) Persistir no Supabase (lançamentos)
      try {
        const { error } = await supabase.from('lancamentos').insert({
          data: novoLanc.data,
          tipo: novoLanc.tipo,
          cod_produto: novoLanc.codProduto,
          produto: novoLanc.produto,
          fornecedor: novoLanc.fornecedor,
          qtde: novoLanc.qtde,
          valor_bruto: novoLanc.valorBruto,
          desconto: novoLanc.desconto ?? null,
          juros: novoLanc.juros ?? null,
          valor_liq: novoLanc.valorLiq,
          forma: novoLanc.forma,
          nr_venda: null, // compra / reposição não tem nº venda
          local: novoLanc.local,
          parcelas: null,
          inicio_pagto: null,
          cliente: null,
          email: null,
          telefone: null,
          vendedor: null,
          status_recb: null,
        });

        if (error) {
          console.error(
            'Erro ao salvar lançamento no Supabase:',
            error,
          );
          alert('Erro ao salvar na nuvem.');
        }
      } catch (e) {
        console.error(
          'Erro inesperado ao salvar lançamento:',
          e,
        );
        alert('Erro inesperado ao salvar na nuvem.');
      }

      // Limpa formulário
      setNovaCompra({
        data: new Date().toISOString().split('T')[0],
        codProduto: '',
        produto: '',
        fornecedor: '',
        qtde: 1,
        valorTotal: 0,
      });
    };

    const valorUnitarioAtual =
      novaCompra.qtde > 0
        ? (novaCompra.valorTotal || 0) / (novaCompra.qtde || 1)
        : 0;

    const isReposicaoLoja = tipoTransacao === 'REPOSICAO_LOJA';

    return (
      <div className="p-6 space-y-6" style={appStyle}>
        {/* Info de carregamento dos produtos */}
        {carregandoProdutos && (
          <p className="text-sm text-gray-500 mb-2">
            Carregando produtos da nuvem...
          </p>
        )}

        {/* Cadastro de Produtos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            Cadastro de Produtos e Estoque Mínimo
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Aqui você ajusta o estoque mínimo de cada produto e
            cadastra a foto e fornecedor. Não precisa mais informar
            endereço de imagem: basta selecionar o arquivo e ele é
            salvo junto ao produto.
          </p>

          <div className="md:flex md:items-start gap-6 mb-4">
            {/* Campos */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={produtoEdit.codProduto}
                  onChange={(e) =>
                    setProdutoEdit({
                      ...produtoEdit,
                      codProduto: e.target.value,
                    })
                  }
                  list="listaProdCod"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <datalist id="listaProdCod">
                  {produtos.map((p, idx) => (
                    <option
                      key={idx}
                      value={p.codProduto}
                    >
                      {p.nome}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Produto
                </label>
                <input
                  type="text"
                  value={produtoEdit.nome}
                  onChange={(e) =>
                    setProdutoEdit({
                      ...produtoEdit,
                      nome: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={produtoEdit.fornecedor}
                  onChange={(e) =>
                    setProdutoEdit({
                      ...produtoEdit,
                      fornecedor: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  min={0}
                  value={produtoEdit.estoqueMinimo}
                  onChange={(e) =>
                    setProdutoEdit({
                      ...produtoEdit,
                      estoqueMinimo: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Upload da foto */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Foto do Produto (upload)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="w-full text-sm"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Selecione uma imagem do computador ou do celular.
                  Não é necessário informar endereço (link) da foto.
                </p>
              </div>
            </div>

            {/* Pré-visualização da foto */}
            <div className="mt-4 md:mt-0 w-full md:w-64 lg:w-72">
              <div className="text-sm font-medium mb-1">
                Pré-visualização
              </div>
              <div className="border-4 border-gray-800 rounded-lg w-full aspect-square flex items-center justify-center overflow-hidden bg-gray-50">
                {produtoEdit.fotoUrl ? (
                  <img
                    src={produtoEdit.fotoUrl}
                    alt="Foto do produto"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '';
                    }}
                  />
                ) : (
                  <span className="text-xs text-gray-500 text-center px-2">
                    A imagem cadastrada para o produto aparecerá aqui.
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={salvarProduto}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Salvar / Atualizar Produto
          </button>
        </div>

        {/* Compras / Reposição */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            Aquisição de Estoque / Reposição
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Escolha o tipo de transação. Na{' '}
            <strong>Reposição Depósito</strong>, você registra
            compras que aumentam o estoque do depósito. Na{' '}
            <strong>Reposição Loja</strong>, você apenas
            transfere quantidade do depósito para a loja, sem
            registrar valor.
          </p>

          {/* Tipo de transação */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">
              Transação
            </label>
            <select
              value={tipoTransacao}
              onChange={(e) =>
                setTipoTransacao(e.target.value)
              }
              className="w-full md:w-64 px-3 py-2 border rounded-lg text-sm"
            >
              <option value="REPOSICAO_DEPOSITO">
                Reposição Depósito (Compra)
              </option>
              <option value="REPOSICAO_LOJA">
                Reposição Loja (Transferência)
              </option>
            </select>
          </div>

          {/* Dados da transação */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Data
              </label>
              <input
                type="date"
                value={novaCompra.data}
                onChange={(e) =>
                  setNovaCompra({
                    ...novaCompra,
                    data: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Código Produto
              </label>
              <input
                type="text"
                value={novaCompra.codProduto}
                onChange={(e) =>
                  selecionarProdutoCompra(e.target.value)
                }
                list="listaProdCodCompra"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <datalist id="listaProdCodCompra">
                {produtos.map((p, idx) => (
                  <option
                    key={idx}
                    value={p.codProduto}
                  >
                    {p.nome}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Produto
              </label>
              <input
                type="text"
                value={novaCompra.produto}
                onChange={(e) =>
                  setNovaCompra({
                    ...novaCompra,
                    produto: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Fornecedor
              </label>
              <input
                type="text"
                value={novaCompra.fornecedor}
                onChange={(e) =>
                  setNovaCompra({
                    ...novaCompra,
                    fornecedor: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                disabled={isReposicaoLoja}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min={1}
                value={novaCompra.qtde}
                onChange={(e) =>
                  setNovaCompra({
                    ...novaCompra,
                    qtde: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Valor Total (R$){' '}
                {isReposicaoLoja && (
                  <span className="text-[10px] text-gray-500">
                    (não usado)
                  </span>
                )}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={novaCompra.valorTotal}
                onChange={(e) =>
                  setNovaCompra({
                    ...novaCompra,
                    valorTotal: Number(e.target.value),
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg ${
                  isReposicaoLoja
                    ? 'bg-gray-100 text-gray-500'
                    : ''
                }`}
                disabled={isReposicaoLoja}
              />
            </div>
            <div className="flex items-end">
              <div className="w-full bg-gray-50 rounded-lg p-3 text-sm">
                <div className="text-xs text-gray-600">
                  Valor Unitário aprox.:
                </div>
                <div className="font-bold text-gray-800">
                  {isReposicaoLoja
                    ? '—'
                    : formatarReal(
                        valorUnitarioAtual || 0,
                      )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={registrarCompra}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Registrar Compra / Reposição e Atualizar Estoque
          </button>
        </div>
      </div>
    );
  };

  // ========================================================================
  // TELA DE PROMISSÓRIAS
  // ========================================================================
  const TelaPromissorias = () => {
    const [mostrarSomenteAtrasadas, setMostrarSomenteAtrasadas] = useState(false);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const ehAtrasada = (p) => {
      if (!p.dataInicio) return false;
      const d = new Date(p.dataInicio);
      if (Number.isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);

      const dataJaPassou = d < hoje;
      const saldoNaoZerado = (p.valor || 0) > 0 && p.status !== 'QUITADO';
      const possuiParcelaAtrasada = (p.parcelasAtrasadas || 0) > 0;

      // Consideramos atrasada se:
      // - a data de início já passou
      // - ainda há saldo
      // - e há parcela atrasada OU status segue ABERTO
      return dataJaPassou && saldoNaoZerado && (possuiParcelaAtrasada || p.status === 'ABERTO');
    };

    const listaFiltrada = promissorias.filter((p) =>
      mostrarSomenteAtrasadas ? ehAtrasada(p) : true,
    );

    const toggleSelecao = async (index) => {
      const prom = promissorias[index];
      if (!prom) return;

      const novoSelecionado = !prom.selecionado;

      setPromissorias((lista) =>
        lista.map((p, idx) =>
          idx === index ? { ...p, selecionado: novoSelecionado } : p,
        ),
      );

      if (prom.id) {
        try {
          const { error } = await supabase
            .from('promissorias')
            .update({ selecionado: novoSelecionado })
            .eq('id', prom.id);

          if (error) {
            console.error('Erro ao atualizar seleção da promissória:', error);
          }
        } catch (e) {
          console.error('Erro inesperado ao atualizar seleção da promissória:', e);
        }
      }
    };

    const enviarEmails = () => {
      const selecionados = promissorias.filter((p) => p.selecionado);
      if (selecionados.length === 0) {
        alert('Nenhuma promissória selecionada.');
        return;
      }
      const emails = selecionados
        .map((p) => `${p.cliente} <${p.email || 'sem-email'}>`)
        .join('\n');
      alert(
        `Simulação de envio de e-mails para:\n\n${emails}\n\n(A integração real de e-mail entra aqui depois.)`,
      );
    };

    const consolidados = Object.values(
      listaFiltrada.reduce((acc, p) => {
        if (!acc[p.cliente]) {
          acc[p.cliente] = {
            cliente: p.cliente,
            email: p.email,
            total: 0,
            atrasadas: 0,
          };
        }
        acc[p.cliente].total += p.valor || 0;
        acc[p.cliente].atrasadas += p.parcelasAtrasadas || 0;
        return acc;
      }, {}),
    );

    return (
      <div className="p-6 space-y-6" style={appStyle}>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {/* Cabeçalho e filtros */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Promissórias em Aberto</h2>
              <p className="text-sm text-gray-600">
                Selecione as vendas para contato e acompanhe quem está com parcelas em atraso.
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={mostrarSomenteAtrasadas}
                  onChange={(e) => setMostrarSomenteAtrasadas(e.target.checked)}
                />
                Mostrar apenas atrasadas
              </label>
              <button
                onClick={enviarEmails}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                <Mail className="w-4 h-4" />
                Enviar e-mails selecionados
              </button>
            </div>
          </div>

          {/* Tabela Promissórias */}
          <div className="overflow-x-auto text-sm mb-6">
            <table
              className="w-full border border-gray-200"
              style={{ minWidth: '950px' }}
            >
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-center align-middle">
                    <input type="checkbox" disabled />
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">Nr Venda</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">Cliente</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">E-mail</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">Saldo Devedor</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    Data inicial de Pagamento
                  </th>
                  <th className="px-3 py-2 text-center whitespace-nowrap">Parcelas</th>
                  <th className="px-3 py-2 text-center whitespace-nowrap">
                    Parcelas em atraso
                  </th>
                  <th className="px-3 py-2 text-center whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((prom, idx) => {
                  const indexOriginal = promissorias.findIndex(
                    (p) => p.nrVenda === prom.nrVenda && p.cliente === prom.cliente,
                  );
                const atrasada = ehAtrasada(prom);

                  return (
                    <tr
                      key={idx}
                      className={`border-t border-gray-200 hover:bg-gray-50 ${
                        atrasada ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={prom.selecionado || false}
                          onChange={() => toggleSelecao(indexOriginal)}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-semibold">
                        {prom.nrVenda}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{prom.cliente}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                        {prom.email || '-'}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-semibold">
                        {formatarReal(prom.valor)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {prom.dataInicio ? formatarDataBR(prom.dataInicio) : ''}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        {prom.parcelas}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            (prom.parcelasAtrasadas || 0) > 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {prom.parcelasAtrasadas || 0}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            prom.status === 'ABERTO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : prom.status === 'QUITADO'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {prom.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {listaFiltrada.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-4 text-center text-xs text-gray-500"
                    >
                      Nenhuma promissória encontrada com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Consolidação por Cliente (agora em tabela) */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Consolidação por Cliente (somente promissórias listadas acima)
            </h3>
            <div className="overflow-x-auto text-sm">
              <table
                className="w-full border border-gray-200"
                style={{ minWidth: '700px' }}
              >
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left whitespace-nowrap">Cliente</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">E-mail</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">
                      Total em Aberto
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap">
                      Parcelas em Atraso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consolidados.map((c, idx) => (
                    <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">{c.cliente}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                        {c.email || '-'}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-semibold">
                        {formatarReal(c.total)}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        {c.atrasadas}
                      </td>
                    </tr>
                  ))}
                  {consolidados.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-center text-xs text-gray-500"
                      >
                        Nenhum cliente com promissórias considerando o filtro atual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

    // ========================================================================
  // TELA DE USUÁRIOS (APENAS ADM)
  // ========================================================================
  const TelaUsuarios = () => {
    const [novoUsuario, setNovoUsuario] = useState({
      nome: '',
      perfil: 'VENDA',
      senha: '',
    });

    // Somente ADM pode ver esta tela
    if (perfil !== 'ADM') {
      return (
        <div className="p-6" style={appStyle}>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-2">Usuários</h2>
            <p className="text-sm text-gray-600">
              Apenas o administrador pode gerenciar usuários.
            </p>
          </div>
        </div>
      );
    }

    const criarUsuario = async () => {
      if (!novoUsuario.nome || !novoUsuario.senha) {
        alert('Preencha Nome e Senha.');
        return;
      }

      // Login interno = mesmo texto do Nome (pra você usar o Nome na tela de login)
      const loginGerado = novoUsuario.nome.trim();

      const existe = usuarios.some(
        (u) => (u.login || u.nome).toLowerCase() === loginGerado.toLowerCase(),
      );
      if (existe) {
        alert('Já existe um usuário com esse nome/login.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('usuarios')
          .insert({
            login: loginGerado,
            nome: novoUsuario.nome,
            perfil: novoUsuario.perfil,
            senha_hash: novoUsuario.senha,
          })
          .select('id, login, nome, perfil, senha_hash')
          .single();

        if (error) {
          console.error('Erro ao criar usuário na nuvem:', error);
          alert('Erro ao criar usuário na nuvem. Veja o console (F12).');
          return;
        }

        const novo = {
          id: data.id,
          login: data.login,
          nome: data.nome,
          perfil: data.perfil,
          senha: data.senha_hash || '',
        };

        setUsuarios((lista) => [...lista, novo]);

        alert('Usuário criado com sucesso!');

        setNovoUsuario({
          nome: '',
          perfil: 'VENDA',
          senha: '',
        });
      } catch (e) {
        console.error('Erro inesperado ao criar usuário:', e);
        alert('Erro inesperado ao criar usuário na nuvem.');
      }
    };

    const alterarSenha = async (id, nomeOuLogin) => {
      const novaSenha = window.prompt(
        `Digite a nova senha para o usuário "${nomeOuLogin}":`,
      );
      if (!novaSenha) return;

      try {
        const { error } = await supabase
          .from('usuarios')
          .update({ senha_hash: novaSenha })
          .eq('id', id);

        if (error) {
          console.error('Erro ao atualizar senha na nuvem:', error);
          alert('Erro ao atualizar senha na nuvem. Veja o console (F12).');
          return;
        }

        // Atualiza também o campo "senha" no estado local (usado no handleLogin)
        setUsuarios((lista) =>
          lista.map((u) =>
            u.id === id ? { ...u, senha: novaSenha } : u,
          ),
        );

        alert('Senha atualizada com sucesso!');
      } catch (e) {
        console.error('Erro inesperado ao atualizar senha:', e);
        alert('Erro inesperado ao atualizar senha na nuvem.');
      }
    };

    const excluirUsuario = async (id, nomeOuLogin, perfilUsuario) => {
      // impede excluir o último ADM
      if (perfilUsuario === 'ADM') {
        const qtdAdms = usuarios.filter((u) => u.perfil === 'ADM').length;
        if (qtdAdms <= 1) {
          alert('Não é possível excluir o último usuário ADM.');
          return;
        }
      }

      const confirma = window.confirm(
        `Tem certeza que deseja excluir o usuário "${nomeOuLogin}"?`,
      );
      if (!confirma) return;

      try {
        const { error } = await supabase.from('usuarios').delete().eq('id', id);

        if (error) {
          console.error('Erro ao excluir usuário na nuvem:', error);
          alert('Erro ao excluir usuário na nuvem. Veja o console (F12).');
          return;
        }

        setUsuarios((lista) => lista.filter((u) => u.id !== id));

        alert('Usuário excluído com sucesso!');
      } catch (e) {
        console.error('Erro inesperado ao excluir usuário:', e);
        alert('Erro inesperado ao excluir usuário na nuvem.');
      }
    };

    return (
      <div className="p-6 space-y-6" style={appStyle}>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Gerenciamento de Usuários</h2>
          <p className="text-sm text-gray-600 mb-4">
            Crie novos logins para administradores, gerentes ou vendedores e altere senhas
            dos usuários existentes.
          </p>

          {/* Formulário novo usuário */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">Nome</label>
              <input
                type="text"
                value={novoUsuario.nome}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, nome: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Nome completo (usado como usuário)"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Perfil</label>
              <select
                value={novoUsuario.perfil}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, perfil: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="ADM">ADM (Dono)</option>
                <option value="GER">GER (Gerente)</option>
                <option value="VENDA">VENDA (Vendedor)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Senha</label>
              <input
                type="password"
                value={novoUsuario.senha}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, senha: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Senha inicial"
              />
            </div>
          </div>

          <button
            onClick={criarUsuario}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Criar usuário
          </button>
        </div>

        {/* Lista de usuários */}
        <div className="bg-white rounded-lg shadow p-6 text-sm">
          <h3 className="text-lg font-semibold mb-3">Usuários cadastrados</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Nome</th>
                  <th className="px-3 py-2 text-left">Perfil</th>
                  <th className="px-3 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{u.nome}</td>
                    <td className="px-3 py-2">{u.perfil}</td>
                    <td className="px-3 py-2 text-center space-x-2">
                      <button
                        onClick={() => alterarSenha(u.id, u.nome || u.login)}
                        className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Alterar senha
                      </button>
                      <button
                        onClick={() =>
                          excluirUsuario(u.id, u.nome || u.login, u.perfil)
                        }
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-4 text-center text-gray-500 text-xs"
                    >
                      Nenhum usuário cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
 

  // ========================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ========================================================================
  if (!perfil) {
    return <TelaLogin />;
  }

  let conteudo = null;

  if (telaAtiva === 'dashboard') {
    conteudo = <TelaDashboard />;
  } else if (telaAtiva === 'vendedor') {
    conteudo = <TelaVendedor />;
  } else if (telaAtiva === 'historico') {
    conteudo = <TelaHistorico />;
  } else if (telaAtiva === 'inventario') {
    conteudo = <TelaInventario />;
  } else if (telaAtiva === 'produtos') {
    conteudo = <TelaProdutos />;
  } else if (telaAtiva === 'promissorias') {
    conteudo = <TelaPromissorias />;
  } else if (telaAtiva === 'usuarios') {
    conteudo = <TelaUsuarios />;
  } else {
    conteudo = <TelaDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-100" style={appStyle}>
      <MenuNavegacao />
      <main className="max-w-7xl mx-auto py-6">{conteudo}</main>
    </div>
  );
};

export default SistemaLoja;