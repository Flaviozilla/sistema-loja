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

// ========================================================================
// HELPERS
// ========================================================================

const formatarReal = (valor) => {
  const n = Number(valor || 0);
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatarDataBR = (dataISO) => {
  if (!dataISO) return '';
  const d = new Date(dataISO);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
};

// ========================================================================
// VALORES PADRÃO / LOCALSTORAGE (USUÁRIOS LOCAIS – APENAS BACKUP)
// ========================================================================

const defaultUsuarios = [
  { login: 'admin', senha: '123', perfil: 'ADM', nome: 'Administrador' },
  { login: 'gerente', senha: '123', perfil: 'GER', nome: 'Gerente' },
  { login: 'venda1', senha: '123', perfil: 'VENDA', nome: 'Vendedor 1' },
];

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================

const SistemaLoja = () => {
  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [usuario, setUsuario] = useState('');
  const [perfil, setPerfil] = useState('');
  const [loginForm, setLoginForm] = useState({ login: '', senha: '' });

  const [usuarios, setUsuarios] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [promissorias, setPromissorias] = useState([]);

  const [carregandoInicial, setCarregandoInicial] = useState(true);

  const appStyle = {
    fontFamily: 'Arial, sans-serif',
  };

  // ======================================================================
  // CARREGAMENTO INICIAL
  // ======================================================================

  useEffect(() => {
    const u = localStorage.getItem('usuario');
    const p = localStorage.getItem('perfil');
    if (u && p) {
      setUsuario(u);
      setPerfil(p);
    }
  }, []);

  useEffect(() => {
    const carregarTudo = async () => {
      try {
        await Promise.all([
          carregarUsuarios(),
          carregarProdutos(),
          carregarEstoque(),
          carregarLancamentos(),
          carregarPromissorias(),
        ]);
      } catch (e) {
        console.error('Erro ao carregar dados iniciais:', e);
      } finally {
        setCarregandoInicial(false);
      }
    };
    carregarTudo();
  }, []);

  // -------------------- Supabase: usuários ----------------------
  const carregarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, login, nome, perfil, senha_hash')
        .order('login', { ascending: true });

      if (error) {
        console.error('Erro ao carregar usuários, usando default:', error);
        setUsuarios(
          defaultUsuarios.map((u, idx) => ({
            id: idx + 1,
            login: u.login,
            nome: u.nome,
            perfil: u.perfil,
            senha_hash: u.senha,
          })),
        );
      } else if (data && data.length > 0) {
        setUsuarios(data);
      } else {
        // se não existir nada na tabela, cadastra os default
        const { data: inseridos, error: erroInsert } = await supabase
          .from('usuarios')
          .insert(
            defaultUsuarios.map((u) => ({
              login: u.login,
              nome: u.nome,
              perfil: u.perfil,
              senha_hash: u.senha,
            })),
          )
          .select('id, login, nome, perfil, senha_hash');

        if (!erroInsert && inseridos) {
          setUsuarios(inseridos);
        } else {
          console.error('Erro ao inserir usuários padrão:', erroInsert);
          setUsuarios(
            defaultUsuarios.map((u, idx) => ({
              id: idx + 1,
              login: u.login,
              nome: u.nome,
              perfil: u.perfil,
              senha_hash: u.senha,
            })),
          );
        }
      }
    } catch (e) {
      console.error('Erro inesperado ao carregar usuários:', e);
      setUsuarios(
        defaultUsuarios.map((u, idx) => ({
          id: idx + 1,
          login: u.login,
          nome: u.nome,
          perfil: u.perfil,
          senha_hash: u.senha,
        })),
      );
    }
  };

  // -------------------- Supabase: produtos ----------------------
  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }
      if (!data) return;

      setProdutos(
        data.map((p) => ({
          id: p.id,
          codProduto: p.cod_produto,
          nome: p.nome,
          fornecedor: p.fornecedor || '',
          estoqueMinimo: p.estoque_minimo || 0,
          valorUnitario: Number(p.valor_unitario || 0),
          fotoUrl: p.foto_url || '',
        })),
      );
    } catch (e) {
      console.error('Erro inesperado ao carregar produtos:', e);
    }
  };

  // -------------------- Supabase: estoque -----------------------
  const carregarEstoque = async () => {
    try {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .order('data_entrada', { ascending: true });

      if (error) {
        console.error('Erro ao carregar estoque:', error);
        return;
      }
      if (!data) return;
      setEstoque(data);
    } catch (e) {
      console.error('Erro inesperado ao carregar estoque:', e);
    }
  };

  // -------------------- Supabase: lançamentos -------------------
  const carregarLancamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .order('data', { ascending: true })
        .order('id_lancament', { ascending: true });

      if (error) {
        console.error('Erro ao carregar lançamentos:', error);
        return;
      }
      if (!data) return;
      setLancamentos(data);
    } catch (e) {
      console.error('Erro inesperado ao carregar lançamentos:', e);
    }
  };

  // -------------------- Supabase: promissórias ------------------
  const carregarPromissorias = async () => {
    try {
      const { data, error } = await supabase
        .from('promissorias')
        .select('*')
        .order('data_inicio', { ascending: true });

      if (error) {
        console.error('Erro ao carregar promissórias:', error);
        return;
      }
      if (!data) return;

      setPromissorias(
        data.map((p) => ({
          ...p,
          parcelasAtrasadas: p.parcelas_atra || p.parcelas_atra || 0,
          selecionado: p.selecionado ?? false,
        })),
      );
    } catch (e) {
      console.error('Erro inesperado ao carregar promissórias:', e);
    }
  };

  // ======================================================================
  // LOGIN / LOGOUT
  // ======================================================================

  const handleLogin = () => {
    const { login, senha } = loginForm;

    const u = usuarios.find(
      (usr) =>
        usr.login.toLowerCase() === login.trim().toLowerCase() &&
        String(usr.senha_hash) === String(senha),
    );

    if (!u) {
      alert('Usuário ou senha inválidos.');
      return;
    }

    setUsuario(u.nome || u.login);
    setPerfil(u.perfil);
    setTelaAtiva('dashboard');

    localStorage.setItem('usuario', u.nome || u.login);
    localStorage.setItem('perfil', u.perfil);
  };

  const handleLogout = () => {
    setUsuario('');
    setPerfil('');
    setTelaAtiva('dashboard');
    localStorage.removeItem('usuario');
    localStorage.removeItem('perfil');
  };

  // ======================================================================
  // TELA DE LOGIN (LAYOUT ANTIGO VERDE)
  // ======================================================================

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

            <h1
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                marginTop: '4px',
              }}
            >
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
                  type="text"
                  value={loginForm.login}
                  onChange={(e) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      login: e.target.value,
                    }))
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
                    setLoginForm((prev) => ({
                      ...prev,
                      senha: e.target.value,
                    }))
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

  // ======================================================================
  // MENU SUPERIOR (SEM DUPLICAR, COM BARRA VERDE)
  // ======================================================================

  const MenuNavegacao = () => {
    if (!perfil) return null;

    const itens = [
      { id: 'dashboard', label: 'Painel' },
      { id: 'vendedor', label: 'Lançamentos (Vendas)' },
      { id: 'historico', label: 'Histórico' },
      { id: 'inventario', label: 'Inventário' },
      { id: 'produtos', label: 'Produtos / Compras' },
      { id: 'promissorias', label: 'Promissórias' },
    ];

    if (perfil === 'ADM') {
      itens.push({ id: 'usuarios', label: 'Usuários' });
    }

    return (
      <header
        style={{
          backgroundColor: '#025302',
          color: '#ffffff',
          padding: '8px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="/logo-wolves.png"
                alt="Logo"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  backgroundColor: '#ffffff',
                }}
              />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  Sistema da Loja
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Usuário: {usuario} ({perfil})
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </div>

          <nav
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            {itens.map((item) => (
              <button
                key={item.id}
                onClick={() => setTelaAtiva(item.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: telaAtiva === item.id ? 'bold' : 'normal',
                  backgroundColor:
                    telaAtiva === item.id ? '#16a34a' : '#f3f4f6',
                  color: telaAtiva === item.id ? '#ffffff' : '#111827',
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
    );
  };

  // ======================================================================
  // (continua nas próximas partes…)
// ======== FIM PARTE 1/3 ========
  // ======================================================================
  // TELA DASHBOARD (bem simples por enquanto)
  // ======================================================================

  const TelaDashboard = () => {
    const totalLancamentos = lancamentos.length;
    const totalPromissorias = promissorias.length;

    const totalBruto = lancamentos.reduce(
      (acc, l) => acc + Number(l.valor_bruto || 0),
      0,
    );

    return (
      <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
          Painel Geral
        </h1>
        <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '16px' }}>
          Visão rápida dos principais indicadores da loja.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <DollarSign size={20} />
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Total Bruto</div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {formatarReal(totalBruto)}
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Package size={20} />
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                Lançamentos de venda
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {totalLancamentos}
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={20} />
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                Promissórias abertas
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {totalPromissorias}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // ---------------------------------------------------------------
  // FUNÇÕES AUXILIARES PARA NÚMERO DA VENDA E INÍCIO DO CRÉDITO
  // ---------------------------------------------------------------
  function gerarNumeroVenda(dataISO) {
    // Gera algo como AAMMDD-1 (ex.: 250307-1)
    if (!dataISO) return '';
    const dt = new Date(dataISO);
    if (Number.isNaN(dt.getTime())) return '';

    const ano2 = String(dt.getFullYear()).slice(-2);
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const dia = String(dt.getDate()).padStart(2, '0');

    // Se quiser depois podemos incrementar o sufixo "-1" conforme quantidade de vendas no dia
    return `${ano2}${mes}${dia}-1`;
  }

  function calcularInicioPgtoCredito(dataISO) {
    // Regra: dia 5 do mês seguinte à venda
    if (!dataISO) return '';
    const dt = new Date(dataISO);
    if (Number.isNaN(dt.getTime())) return '';

    let ano = dt.getFullYear();
    let mes = dt.getMonth(); // 0..11

    mes += 1; // próximo mês
    if (mes > 11) {
      mes = 0;
      ano += 1;
    }

    const inicio = new Date(ano, mes, 5);
    return inicio.toISOString().split('T')[0]; // "yyyy-mm-dd"
  }

// ========================================================================
// TELA VENDEDOR (LANÇAMENTOS DE VENDAS)
// ========================================================================
const TelaVendedor = () => {
  const [novaVenda, setNovaVenda] = useState({
    data: new Date().toISOString().split("T")[0],
    cliente: "",
    email: "",
    telefone: "",
    produto: "",
    codProduto: "",
    fornecedor: "",
    qtde: 1,
    valorBruto: 0,
    desconto: 0,
    juros: 0,
    valorLiq: 0,
    forma: "PIX",
    nrVenda: "",
    local: "LOJA",
    parcelas: 1,
    inicioPagamento: "",
    fotoUrl: "",
  });

  // lista de produtos com base nos movimentos de estoque
  // (usa cod_produto, que é como vem do Supabase)
  const produtosEstoque = Array.from(
    new Map(
      estoque.map((e) => [
        String(e.cod_produto),
        {
          codProduto: String(e.cod_produto),
          produto: e.produto,
        },
      ])
    ).values()
  );

  // Valor unitário padrão do produto:
  // 1) cadastro em "produtos"
  // 2) se não tiver, última COMPRA nos lançamentos
  const obterValorUnitario = (cod) => {
    if (!cod) return 0;
    const codStr = String(cod);

    const prodCad = produtos.find((p) => String(p.codProduto) === codStr);
    if (prodCad && prodCad.valorUnitario && prodCad.valorUnitario > 0) {
      return Number(prodCad.valorUnitario);
    }

    const ultCompra = [...lancamentos]
      .filter(
        (l) =>
          l.tipo === "COMPRA" &&
          String(l.codProduto) === codStr &&
          Number(l.qtde || 0) > 0
      )
      .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

    if (ultCompra && ultCompra.valorLiq && ultCompra.qtde) {
      return Number(ultCompra.valorLiq) / Number(ultCompra.qtde);
    }

    return 0;
  };

  const encontrarInfoProduto = (cod, nome) => {
    let item = null;

    if (cod) {
      const codStr = String(cod);
      item =
        estoque.find(
          (e) =>
            String(e.cod_produto) === codStr &&
            (e.local || "").toUpperCase() === "LOJA"
        ) ||
        estoque.find((e) => String(e.cod_produto) === codStr);
    }

    if (!item && nome) {
      item =
        estoque.find(
          (e) =>
            e.produto === nome &&
            (e.local || "").toUpperCase() === "LOJA"
        ) || estoque.find((e) => e.produto === nome);
    }

    if (!item) return null;

    const codStr = String(item.cod_produto);
    const prodCad = produtos.find((p) => String(p.codProduto) === codStr);
    const valorUnitario = obterValorUnitario(codStr);
    const fotoUrl = prodCad && prodCad.fotoUrl ? prodCad.fotoUrl : "";

    return {
      codProduto: codStr,
      produto: item.produto,
      fornecedor: limparFornecedorTexto(
        item.fornecedor || (prodCad?.fornecedor ?? "")
      ),
      valorUnitario,
      fotoUrl,
    };
  };

  const calcularValorLiquido = (vendaBase) => {
    const { valorBruto, desconto, juros } = vendaBase;
    return (
      (Number(valorBruto) || 0) -
      (Number(desconto) || 0) +
      (Number(juros) || 0)
    );
  };

  const atualizarVendaComProduto = (info) => {
    setNovaVenda((anterior) => {
      const atual = { ...anterior };

      atual.codProduto = info.codProduto;
      atual.produto = info.produto;
      atual.fornecedor = info.fornecedor || "";
      atual.fotoUrl = info.fotoUrl || "";

      const qtdeNum = Number(atual.qtde) || 0;
      if (info.valorUnitario && qtdeNum > 0) {
        const bruto = info.valorUnitario * qtdeNum;
        atual.valorBruto = Math.round(bruto * 100) / 100;
      }

      atual.valorLiq = calcularValorLiquido(atual);

      if (atual.data) {
        atual.nrVenda = gerarNumeroVenda(atual.data);
      }

      if (atual.forma === "CREDITO") {
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
      setNovaVenda((anterior) => ({ ...anterior, codProduto: cod }));
    }
  };

  const selecionarProdutoPorNome = (nome) => {
    const info = encontrarInfoProduto(null, nome);
    if (info) {
      atualizarVendaComProduto(info);
    } else {
      setNovaVenda((anterior) => ({ ...anterior, produto: nome }));
    }
  };

  const handleChange = (campo, valor, pularProduto = false) => {
    setNovaVenda((anterior) => {
      let atual = { ...anterior, [campo]: valor };

      // Data: gera nr venda e ajusta início pgto crédito
      if (campo === "data") {
        atual.nrVenda = gerarNumeroVenda(atual.data);

        if (atual.forma === "CREDITO") {
          atual.inicioPagamento = calcularInicioPgtoCredito(atual.data);
        }
      }

      // Forma de pagamento
      if (campo === "forma") {
        if (valor === "CREDITO") {
          atual.inicioPagamento = calcularInicioPgtoCredito(atual.data);
        } else if (valor === "PROMISSORIA") {
          atual.inicioPagamento = "";
        } else {
          atual.inicioPagamento = "";
        }
      }

      // Quantidade → recalcula valor bruto automático
      if (campo === "qtde") {
        const infoProd = encontrarInfoProduto(
          atual.codProduto,
          atual.produto
        );
        const qtdeNum = Number(valor) || 0;
        const valorUnit = infoProd ? infoProd.valorUnitario : 0;
        if (valorUnit && qtdeNum > 0) {
          const bruto = valorUnit * qtdeNum;
          atual.valorBruto = Math.round(bruto * 100) / 100;
        } else {
          atual.valorBruto = 0;
        }
      }

      // Sempre que mexer em valores, recalcula valor líquido
      if (["valorBruto", "desconto", "juros", "qtde"].includes(campo)) {
        atual.valorLiq = calcularValorLiquido(atual);
      }

      // Seleção de produto por código ou nome digitados diretamente
      if (!pularProduto && (campo === "codProduto" || campo === "produto")) {
        const info = encontrarInfoProduto(
          campo === "codProduto" ? valor : atual.codProduto,
          campo === "produto" ? valor : atual.produto
        );
        if (info) {
          atual.codProduto = info.codProduto;
          atual.produto = info.produto;
          atual.fornecedor = info.fornecedor || atual.fornecedor;
          atual.fotoUrl = info.fotoUrl || atual.fotoUrl;

          const qtdeNum = Number(atual.qtde) || 0;
          if (info.valorUnitario && qtdeNum > 0) {
            const bruto = info.valorUnitario * qtdeNum;
            atual.valorBruto = Math.round(bruto * 100) / 100;
          }
          atual.valorLiq = calcularValorLiquido(atual);
        }
      }

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

  // 2) Movimento de ESTOQUE DA LOJA (saída = quantidade negativa)
  const movimentoBase = {
    cod_produto: lancVenda.codProduto,
    produto: lancVenda.produto,
    fornecedor: limparFornecedorTexto(lancVenda.fornecedor),
    local: 'LOJA',
    qtde: -Number(lancVenda.qtde || 0),
    data_entrada: lancVenda.data,
  };

  let movimentoInserido = null;

  try {
    const { data: movData, error: movError } = await supabase
      .from('estoque')
      .insert(movimentoBase)
      .select(
        'id, cod_produto, produto, fornecedor, local, qtde, data_entrada',
      );

    if (movError) {
      console.error('Erro ao registrar movimento de estoque da venda:', movError);
    } else if (movData && movData.length > 0) {
      movimentoInserido = movData[0];
    }
  } catch (e) {
    console.error('Erro inesperado ao registrar movimento de estoque da venda:', e);
  }

  // Mesmo que o Supabase dê erro, garante o movimento no estado local
  if (!movimentoInserido) {
    movimentoInserido = {
      id: Date.now(), // id fake só para controle local
      ...movimentoBase,
    };
  }

  setEstoque((lista) => [...lista, movimentoInserido]);

  // 3) Se for promissória, salva também em promissórias
  if ((lancVenda.forma || '').toUpperCase() === 'PROMISSORIA') {
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

  // 4) Salvar venda no Supabase (tabela lançamentos)
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
        (lancVenda.forma || '').toUpperCase() === 'PROMISSORIA'
          ? lancVenda.parcelas
          : null,
      inicio_pagto: lancVenda.inicioPagamento || null,
      cliente: lancVenda.cliente,
      email: lancVenda.email,
      telefone: lancVenda.telefone,
      vendedor: lancVenda.vendedor,
      status_recb:
        (lancVenda.forma || '').toUpperCase() === 'PROMISSORIA'
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

  // 5) Limpa formulário
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
    fotoUrl: '',
  });
};

  return (
    <div className="p-6 space-y-6" style={appStyle}>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Lançamento de Venda</h2>
        <p className="text-sm text-gray-600 mb-4">
          Preencha os dados da venda. O estoque da <strong>LOJA</strong> será
          atualizado automaticamente.
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          {/* FORMULÁRIO PRINCIPAL */}
          <div className="flex-1">
            {/* Linha 1 - Data, Nr Venda, Forma, Parcelas, Início Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 text-sm">
              <div>
                <label className="block font-semibold mb-1">Data</label>
                <input
                  type="date"
                  value={novaVenda.data}
                  onChange={(e) => handleChange("data", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Nr Venda</label>
                <input
                  type="text"
                  value={novaVenda.nrVenda}
                  onChange={(e) => handleChange("nrVenda", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Gerado automaticamente"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Forma de pagamento
                </label>
                <select
                  value={novaVenda.forma}
                  onChange={(e) => handleChange("forma", e.target.value)}
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
                  onChange={(e) =>
                    handleChange("parcelas", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Data inicial de pagamento
                </label>
                <input
                  type="date"
                  value={novaVenda.inicioPagamento}
                  onChange={(e) =>
                    handleChange("inicioPagamento", e.target.value)
                  }
                  disabled={novaVenda.forma === "CREDITO"}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    novaVenda.forma === "CREDITO"
                      ? "bg-gray-100 text-gray-500"
                      : ""
                  }`}
                />
                {novaVenda.forma === "CREDITO" && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Para crédito, o início é calculado para o dia 5 do mês
                    seguinte.
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
                  onChange={(e) => handleChange("cliente", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">E-mail</label>
                <input
                  type="email"
                  value={novaVenda.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Telefone</label>
                <input
                  type="text"
                  value={novaVenda.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Linha 3 - Produto */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <label className="block font-semibold mb-1">
                  Código Produto
                </label>
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
                  onChange={(e) =>
                    handleChange("fornecedor", e.target.value)
                  }
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
                  onChange={(e) => handleChange("qtde", Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Linha 4 - Valores */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <label className="block font-semibold mb-1">
                  Valor Bruto (R$)
                </label>
                <input
                  type="text"
                  value={novaVenda.valorBruto.toFixed(2).replace(".", ",")}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={novaVenda.desconto}
                  onChange={(e) =>
                    handleChange("desconto", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Juros (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={novaVenda.juros}
                  onChange={(e) =>
                    handleChange("juros", Number(e.target.value))
                  }
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

          {/* PRÉ-VISUALIZAÇÃO DA FOTO */}
          <div className="w-full md:w-72 lg:w-80">
            <div className="text-sm font-semibold mb-1">Foto do produto</div>
            <div className="border-4 border-gray-800 rounded-lg w-full aspect-square flex items-center justify-center overflow-hidden bg-gray-50">
              {novaVenda.fotoUrl ? (
                <img
                  src={novaVenda.fotoUrl}
                  alt="Foto do produto"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                  }}
                />
              ) : (
                <span className="text-xs text-gray-500 text-center px-2">
                  Ao selecionar um produto com foto cadastrada, a imagem
                  aparecerá aqui.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
   
// ======================================================================
// TELA HISTÓRICO (com Nr Venda, Forma e Valor Final)
// ======================================================================

const TelaHistorico = () => {
  // Garante que sempre temos o valor final, independente do nome do campo
  const pegarValorFinal = (l) => {
    if (l.valorLiq != null) return Number(l.valorLiq);
    if (l.valor_liq != null) return Number(l.valor_liq);
    if (l.valorBruto != null) return Number(l.valorBruto);
    if (l.valor_bruto != null) return Number(l.valor_bruto);
    return 0;
  };

  const pegarNrVenda = (l) => {
    if (l.nrVenda != null) return l.nrVenda;
    if (l.nr_venda != null) return l.nr_venda;
    return '';
  };

  const pegarForma = (l) => l.forma || '';

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
        Histórico de Lançamentos
      </h2>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ overflowX: 'auto', fontSize: '11px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'center',
            }}
          >
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '6px', borderBottom: '1px solid #e5e7eb' }}>
                  Data
                </th>
                <th style={{ padding: '6px', borderBottom: '1px solid #e5e7eb' }}>
                  Tipo
                </th>
                <th style={{ padding: '6px', borderBottom: '1px solid #e5e7eb' }}>
                  Nr Venda
                </th>
                <th style={{ padding: '6px', borderBottom: '1px solid #e5e7eb' }}>
                  Forma Pgto
                </th>
                <th style={{ padding: '6px', borderBottom: '1px solid #e5e7eb' }}>
                  Produto
                </th>
                <th style={{ padding: '6px', borderBottom: '1px solid #e5e7eb' }}>
                  Qtde
                </th>
                <th style={{ padding: '6px', borderBottom: '1px solid #e5e7eb' }}>
                  Valor Final da Venda
                </th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {formatarDataBR(l.data)}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {l.tipo}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {pegarNrVenda(l)}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {pegarForma(l)}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {l.produto}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {l.qtde}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {formatarReal(pegarValorFinal(l))}
                  </td>
                </tr>
              ))}
              {lancamentos.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '8px', fontSize: '11px' }}>
                    Nenhum lançamento registrado.
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

  // ======================================================================
  // (continua na PARTE 3/3)
// ======== FIM PARTE 2/3 ========
  // ======================================================================
  // HELPER PARA FORNECEDOR (SUBSTITUI A FRASE ESTRANHA)
  // ======================================================================
  const limparFornecedorTexto = (texto) => {
    if (texto === 'Não se trata de um problema de snooker.') {
      return 'Fornecedor';
    }
    return texto || '';
  };

// ======================================================================
// TELA DE INVENTÁRIO
// ======================================================================
const TelaInventario = () => {
  const [filtroLocal, setFiltroLocal] = useState('DEPOSITO'); // DEPOSITO | LOJA | TODOS
  const [filtroData, setFiltroData] = useState(''); // AAAA-MM-DD ou vazio

  const dataLimite = filtroData ? new Date(filtroData) : null;

  // --------------------------------------------------------------------
  // 1) MOVIMENTOS FILTRADOS (usados na TABELA + IMPRESSÃO)
  // --------------------------------------------------------------------
  const movimentosFiltrados = estoque.filter((mov) => {
    if (filtroLocal !== 'TODOS' && mov.local !== filtroLocal) return false;

    if (dataLimite) {
      const d = mov.data_entrada ? new Date(mov.data_entrada) : null;
      if (!d || d > dataLimite) return false;
    }
    return true;
  });

  // Consolida por (produto + local) APENAS PARA A TABELA
  const mapa = {};
  movimentosFiltrados.forEach((mov) => {
    const chave = `${mov.cod_produto}|${mov.local}`;
    if (!mapa[chave]) {
      const prod = produtos.find((p) => p.codProduto === mov.cod_produto);
      const valorUnit = prod ? Number(prod.valorUnitario || 0) : 0;

      mapa[chave] = {
        cod_produto: mov.cod_produto,
        produto: mov.produto,
        fornecedor: limparFornecedorTexto(
          mov.fornecedor || (prod?.fornecedor ?? ''),
        ),
        local: mov.local,
        qtde: 0,
        valor_unitario: valorUnit,
      };
    }
    mapa[chave].qtde += Number(mov.qtde || 0);
  });

  const linhasInventario = Object.values(mapa).filter(
    (linha) => linha.qtde !== 0,
  );

  // --------------------------------------------------------------------
  // 2) RESUMO GERAL POR LOCAL (usado NOS CARDS)
  //    -> ignora filtroLocal, só respeita a data
  // --------------------------------------------------------------------
  const mapaTotais = {};
  estoque.forEach((mov) => {
    if (dataLimite) {
      const d = mov.data_entrada ? new Date(mov.data_entrada) : null;
      if (!d || d > dataLimite) return;
    }

    const chave = `${mov.cod_produto}|${mov.local}`;
    if (!mapaTotais[chave]) {
      const prod = produtos.find((p) => p.codProduto === mov.cod_produto);
      const valorUnit = prod ? Number(prod.valorUnitario || 0) : 0;

      mapaTotais[chave] = {
        cod_produto: mov.cod_produto,
        produto: mov.produto,
        fornecedor: limparFornecedorTexto(
          mov.fornecedor || (prod?.fornecedor ?? ''),
        ),
        local: mov.local,
        qtde: 0,
        valor_unitario: valorUnit,
      };
    }
    mapaTotais[chave].qtde += Number(mov.qtde || 0);
  });

  const linhasTotais = Object.values(mapaTotais).filter(
    (linha) => linha.qtde !== 0,
  );

  // Totais por local (USANDO linhasTotais)
  const totalQtdeDeposito = linhasTotais
    .filter((l) => l.local === 'DEPOSITO')
    .reduce((acc, l) => acc + l.qtde, 0);

  const totalQtdeLoja = linhasTotais
    .filter((l) => l.local === 'LOJA')
    .reduce((acc, l) => acc + l.qtde, 0);

  const totalValorDeposito = linhasTotais
    .filter((l) => l.local === 'DEPOSITO')
    .reduce((acc, l) => acc + l.qtde * l.valor_unitario, 0);

  const totalValorLoja = linhasTotais
    .filter((l) => l.local === 'LOJA')
    .reduce((acc, l) => acc + l.qtde * l.valor_unitario, 0);

  const localTitulo =
    filtroLocal === 'TODOS'
      ? 'DEPÓSITO E LOJA'
      : filtroLocal === 'DEPOSITO'
      ? 'DEPÓSITO'
      : 'LOJA';

  const dataTitulo = filtroData || new Date().toISOString().slice(0, 10);

  const imprimirInventario = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const linhasHtml = linhasInventario
      .map(
        (l) => `
        <tr>
          <td>${l.cod_produto}</td>
          <td>${l.produto}</td>
          <td>${l.fornecedor}</td>
          <td>${l.local}</td>
          <td style="text-align:right;">${l.qtde}</td>
          <td style="text-align:right;">${formatarReal(l.valor_unitario)}</td>
          <td style="text-align:right;">${formatarReal(
            l.qtde * l.valor_unitario,
          )}</td>
        </tr>
      `,
      )
      .join('');

    win.document.write(`
      <html>
        <head>
          <title>Inventário</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 14px; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: center; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <div style="text-align:center;">
            <img src="/logo-wolves.png" alt="Logo" style="width:90px;height:90px;object-fit:contain;border-radius:50%;"/>
            <h1>INVENTÁRIO DA ${localTitulo}</h1>
            <h2>no dia ${formatarDataBR(dataTitulo)}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th>Fornecedor</th>
                <th>Local</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Valor em Estoque</th>
              </tr>
            </thead>
            <tbody>
              ${
                linhasHtml ||
                '<tr><td colspan="7">Nenhum registro para os filtros selecionados.</td></tr>'
              }
            </tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div
      style={{
        padding: '16px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '8px',
        }}
      >
        Inventário de Estoque
      </h2>

      {/* Cards de resumo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            background: '#e5f9e7',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#166534' }}>Total no Depósito</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {totalQtdeDeposito} un.
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px' }}>
            Valor estimado: {formatarReal(totalValorDeposito)}
          </div>
        </div>

        <div
          style={{
            background: '#dbeafe',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#1d4ed8' }}>Total na Loja</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {totalQtdeLoja} un.
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px' }}>
            Valor estimado: {formatarReal(totalValorLoja)}
          </div>
        </div>
      </div>

      {/* Filtros + botão imprimir */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '12px',
          fontSize: '13px',
        }}
      >
        <div>
          <label style={{ fontWeight: 'bold', marginRight: 4 }}>
            Local de armazenamento:
          </label>
          <select
            value={filtroLocal}
            onChange={(e) => setFiltroLocal(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
            }}
          >
            <option value="DEPOSITO">Depósito</option>
            <option value="LOJA">Loja</option>
            <option value="TODOS">Depósito e Loja</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', marginRight: 4 }}>Até a data:</label>
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
            }}
          />
        </div>

        <button
          onClick={imprimirInventario}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#111827',
            color: '#ffffff',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          ExportarPDF
        </button>
      </div>

      {/* Tabela centralizada */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            margin: '0 auto',
            borderCollapse: 'collapse',
            fontSize: '12px',
            minWidth: '700px',
            textAlign: 'center',
          }}
        >
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Código</th>
              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Produto</th>
              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                Fornecedor
              </th>
              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Local</th>
              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                Quantidade
              </th>
              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                Valor Unitário
              </th>
              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                Valor em Estoque
              </th>
            </tr>
          </thead>
          <tbody>
            {linhasInventario.map((l, idx) => (
              <tr key={idx}>
                <td style={{ padding: '4px 6px', border: '1px solid #f3f4f6' }}>
                  {l.cod_produto}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #f3f4f6' }}>
                  {l.produto}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #f3f4f6' }}>
                  {l.fornecedor}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #f3f4f6' }}>
                  {l.local}
                </td>
                <td
                  style={{
                    padding: '4px 6px',
                    border: '1px solid #f3f4f6',
                    textAlign: 'right',
                  }}
                >
                  {l.qtde}
                </td>
                <td
                  style={{
                    padding: '4px 6px',
                    border: '1px solid #f3f4f6',
                    textAlign: 'right',
                  }}
                >
                  {formatarReal(l.valor_unitario)}
                </td>
                <td
                  style={{
                    padding: '4px 6px',
                    border: '1px solid #f3f4f6',
                    textAlign: 'right',
                  }}
                >
                  {formatarReal(l.qtde * l.valor_unitario)}
                </td>
              </tr>
            ))}
            {linhasInventario.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '8px', fontSize: '11px' }}>
                  Nenhum registro para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

  // ======================================================================
// TELA DE PRODUTOS / COMPRAS
// ======================================================================
const TelaProdutos = () => {
  const [produtoForm, setProdutoForm] = useState({
    codProduto: '',
    nome: '',
    fornecedor: '',
    estoqueMinimo: 0,
    valorUnitario: 0,
    fotoUrl: '',
  });

  const [tipoTransacao, setTipoTransacao] = useState('REPOSICAO_DEPOSITO');
  const isReposicaoLoja = tipoTransacao === 'REPOSICAO_LOJA';

  const [novaCompra, setNovaCompra] = useState({
    data: '',
    codProduto: '',
    produto: '',
    fornecedor: '',
    qtde: 0,
    valorTotal: 0, // fica agora apenas como campo "sobrando" (não é digitado nem usado)
  });

  const [valorUnitarioAtual, setValorUnitarioAtual] = useState(0);

  // Valor total calculado automaticamente (qtde × valor unitário cadastrado)
  const valorTotalCalculado =
    Number(novaCompra.qtde || 0) * Number(valorUnitarioAtual || 0);

  // Produto selecionado na parte de COMPRAS (para mostrar foto)
  const produtoSelecionadoCompra = produtos.find(
    (x) =>
      x.codProduto.toString().toLowerCase() ===
      (novaCompra.codProduto || '').toLowerCase(),
  );
  const fotoCompraUrl = produtoSelecionadoCompra?.fotoUrl || '';

  const selecionarProdutoEdicao = (cod) => {
    const p = produtos.find(
      (x) => x.codProduto.toString().toLowerCase() === cod.toLowerCase(),
    );
    if (!p) {
      setProdutoForm((prev) => ({ ...prev, codProduto: cod }));
      return;
    }
    setProdutoForm({
      codProduto: p.codProduto,
      nome: p.nome,
      fornecedor: limparFornecedorTexto(p.fornecedor),
      estoqueMinimo: p.estoqueMinimo || 0,
      valorUnitario: p.valorUnitario || 0,
      fotoUrl: p.fotoUrl || '',
    });
    setValorUnitarioAtual(p.valorUnitario || 0);
  };

  const handleArquivoFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProdutoForm((prev) => ({
        ...prev,
        fotoUrl: reader.result || '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const salvarProduto = async () => {
    if (!produtoForm.codProduto || !produtoForm.nome) {
      alert('Preencha pelo menos código e nome do produto.');
      return;
    }

    const payload = {
      cod_produto: produtoForm.codProduto,
      nome: produtoForm.nome,
      fornecedor: limparFornecedorTexto(produtoForm.fornecedor),
      estoque_minimo: Number(produtoForm.estoqueMinimo || 0),
      valor_unitario: Number(produtoForm.valorUnitario || 0),
      foto_url: produtoForm.fotoUrl || null,
    };

    try {
      const { data, error } = await supabase
        .from('produtos')
        .upsert(payload, { onConflict: 'cod_produto' })
        .select(
          'cod_produto, nome, fornecedor, estoque_minimo, valor_unitario, foto_url',
        );

      if (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro ao salvar produto.');
        return;
      }

      const listaConvertida = (data || []).map((p) => ({
        codProduto: p.cod_produto,
        nome: p.nome,
        fornecedor: p.fornecedor,
        estoqueMinimo: p.estoque_minimo,
        valorUnitario: p.valor_unitario,
        fotoUrl: p.foto_url,
      }));

      setProdutos((lista) => {
        const mapa = new Map(lista.map((p) => [p.codProduto, p]));
        listaConvertida.forEach((p) => mapa.set(p.codProduto, p));
        return Array.from(mapa.values());
      });

      alert('Produto salvo/atualizado com sucesso!');
    } catch (e) {
      console.error('Erro inesperado ao salvar produto:', e);
      alert('Erro inesperado ao salvar produto.');
    }
  };

  const selecionarProdutoCompra = (cod) => {
    const p = produtos.find(
      (x) => x.codProduto.toString().toLowerCase() === cod.toLowerCase(),
    );
    if (!p) {
      setNovaCompra((prev) => ({
        ...prev,
        codProduto: cod,
        produto: '',
        fornecedor: '',
      }));
      setValorUnitarioAtual(0);
      return;
    }

    setNovaCompra((prev) => ({
      ...prev,
      codProduto: p.codProduto,
      produto: p.nome,
      fornecedor: limparFornecedorTexto(p.fornecedor),
    }));
    setValorUnitarioAtual(p.valorUnitario || 0);
  };

  const registrarCompra = async () => {
    if (!novaCompra.codProduto) {
      alert('Informe o código do produto.');
      return;
    }

    const prod = produtos.find(
      (x) =>
        x.codProduto.toString().toLowerCase() ===
        novaCompra.codProduto.toLowerCase(),
    );
    if (!prod) {
      alert('Produto não cadastrado.');
      return;
    }

    const qtde = Number(novaCompra.qtde || 0);
    if (qtde <= 0) {
      alert('Informe uma quantidade maior que zero.');
      return;
    }

    if (!novaCompra.data) {
      alert('Informe a data da movimentação.');
      return;
    }

    // Agora o valor unitário vem SEMPRE do cadastro
    let valorUnit = valorUnitarioAtual;

    if (!isReposicaoLoja) {
      if (!valorUnit) {
        alert(
          'Este produto não possui valor unitário cadastrado. Defina um valor unitário no cadastro antes de registrar a compra.',
        );
        return;
      }
    }

    try {
      // Se quiser, pode manter a atualização do valor unitário no banco
      // (não muda nada se ele já estiver igual)
      if (!isReposicaoLoja) {
        await supabase
          .from('produtos')
          .update({ valor_unitario: valorUnit })
          .eq('cod_produto', prod.codProduto);

        setProdutos((lista) =>
          lista.map((p) =>
            p.codProduto === prod.codProduto
              ? { ...p, valorUnitario: valorUnit }
              : p,
          ),
        );
      }

      // Registra movimentos no estoque (entrada e/ou transferência)
      const movimentos = [];
      if (isReposicaoLoja) {
        // transferência: -depósito / +loja
        movimentos.push({
          cod_produto: prod.codProduto,
          produto: prod.nome,
          fornecedor: limparFornecedorTexto(
            novaCompra.fornecedor || prod.fornecedor,
          ),
          local: 'DEPOSITO',
          qtde: -qtde,
          data_entrada: novaCompra.data,
        });
        movimentos.push({
          cod_produto: prod.codProduto,
          produto: prod.nome,
          fornecedor: limparFornecedorTexto(
            novaCompra.fornecedor || prod.fornecedor,
          ),
          local: 'LOJA',
          qtde: qtde,
          data_entrada: novaCompra.data,
        });
      } else {
        // compra: entrada no depósito
        movimentos.push({
          cod_produto: prod.codProduto,
          produto: prod.nome,
          fornecedor: limparFornecedorTexto(
            novaCompra.fornecedor || prod.fornecedor,
          ),
          local: 'DEPOSITO',
          qtde: qtde,
          data_entrada: novaCompra.data,
        });
      }

      const { data, error } = await supabase
        .from('estoque')
        .insert(movimentos)
        .select(
          'id, cod_produto, produto, fornecedor, local, qtde, data_entrada',
        );

      if (error) {
        console.error('Erro ao registrar movimentação de estoque:', error);
        alert('Erro ao registrar movimentação de estoque.');
        return;
      }

      setEstoque((lista) => [...lista, ...(data || [])]);

      alert('Compra / reposição registrada com sucesso!');

      setNovaCompra({
        data: '',
        codProduto: '',
        produto: '',
        fornecedor: '',
        qtde: 0,
        valorTotal: 0,
      });
      // mantém valorUnitarioAtual do produto selecionado
    } catch (e) {
      console.error('Erro inesperado ao registrar compra:', e);
      alert('Erro inesperado ao registrar compra.');
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '8px',
        }}
      >
        Produtos / Compras
      </h2>

      {/* Cadastro de produto */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          Cadastro de Produto
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            fontSize: '13px',
          }}
        >
          <div>
            <label
              style={{ fontWeight: 'bold', marginBottom: 4, display: 'block' }}
            >
              Código
            </label>
            <input
              type="text"
              value={produtoForm.codProduto}
              onChange={(e) => selecionarProdutoEdicao(e.target.value)}
              list="listaProdCodEdicao"
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
              }}
            />
            <datalist id="listaProdCodEdicao">
              {produtos.map((p) => (
                <option key={p.codProduto} value={p.codProduto}>
                  {p.nome}
                </option>
              ))}
            </datalist>
          </div>

          <div>
            <label
              style={{ fontWeight: 'bold', marginBottom: 4, display: 'block' }}
            >
              Nome
            </label>
            <input
              type="text"
              value={produtoForm.nome}
              onChange={(e) =>
                setProdutoForm((prev) => ({ ...prev, nome: e.target.value }))
              }
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div>
            <label
              style={{ fontWeight: 'bold', marginBottom: 4, display: 'block' }}
            >
              Fornecedor
            </label>
            <input
              type="text"
              value={produtoForm.fornecedor}
              onChange={(e) =>
                setProdutoForm((prev) => ({
                  ...prev,
                  fornecedor: e.target.value,
                }))
              }
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div>
            <label
              style={{ fontWeight: 'bold', marginBottom: 4, display: 'block' }}
            >
              Estoque mínimo
            </label>
            <input
              type="number"
              min={0}
              value={produtoForm.estoqueMinimo}
              onChange={(e) =>
                setProdutoForm((prev) => ({
                  ...prev,
                  estoqueMinimo: Number(e.target.value || 0),
                }))
              }
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div>
            <label
              style={{ fontWeight: 'bold', marginBottom: 4, display: 'block' }}
            >
              Valor unitário (R$)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={produtoForm.valorUnitario}
              onChange={(e) =>
                setProdutoForm((prev) => ({
                  ...prev,
                  valorUnitario: Number(e.target.value || 0),
                }))
              }
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div>
            <label
              style={{ fontWeight: 'bold', marginBottom: 4, display: 'block' }}
            >
              URL da foto (opcional)
            </label>
            <input
              type="text"
              value={produtoForm.fotoUrl}
              onChange={(e) =>
                setProdutoForm((prev) => ({ ...prev, fotoUrl: e.target.value }))
              }
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
              }}
              placeholder="Cole aqui o endereço da imagem (se tiver)"
            />
            <label
              style={{
                fontWeight: 'bold',
                marginBottom: 4,
                display: 'block',
                marginTop: 6,
              }}
            >
              Foto local (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleArquivoFoto}
              style={{ fontSize: '11px' }}
            />
          </div>

          {/* Pré-visualização da foto (CADASTRO) */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: 4,
              }}
            >
              Pré-visualização
            </div>
            <div
              style={{
                border: '2px solid #111827',
                borderRadius: '8px',
                width: '100%',
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#f9fafb',
              }}
            >
              {produtoForm.fotoUrl ? (
                <img
                  src={produtoForm.fotoUrl}
                  alt="Foto do produto"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    textAlign: 'center',
                    padding: '4px',
                  }}
                >
                  A imagem cadastrada para o produto aparecerá aqui.
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <button
            onClick={salvarProduto}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Salvar / Atualizar Produto
          </button>
        </div>
      </div>

      {/* Compras / Reposição */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          Aquisição de Estoque / Reposição
        </h3>
        <p
          style={{ fontSize: '12px', color: '#4b5563', marginBottom: '8px' }}
        >
          Na <strong>Reposição Depósito</strong>, você registra compras que
          aumentam o estoque do depósito. Na{' '}
          <strong>Reposição Loja</strong>, você transfere quantidade do depósito
          para a loja, sem registrar valor.
        </p>

        <div
          style={{
            marginBottom: '8px',
            fontSize: '13px',
          }}
        >
          <label
            style={{
              fontWeight: 'bold',
              marginBottom: 4,
              display: 'block',
            }}
          >
            Transação
          </label>
          <select
            value={tipoTransacao}
            onChange={(e) => setTipoTransacao(e.target.value)}
            style={{
              width: '220px',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
            }}
          >
            <option value="REPOSICAO_DEPOSITO">
              Reposição Depósito (Compra)
            </option>
            <option value="REPOSICAO_LOJA">
              Reposição Loja (Transferência)
            </option>
          </select>
        </div>

        {/* Formulário + foto da compra */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          {/* Lado ESQUERDO: campos da compra */}
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                fontSize: '13px',
                marginBottom: '8px',
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Data
                </label>
                <input
                  type="date"
                  value={novaCompra.data}
                  onChange={(e) =>
                    setNovaCompra((prev) => ({
                      ...prev,
                      data: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Código Produto
                </label>
                <input
                  type="text"
                  value={novaCompra.codProduto}
                  onChange={(e) => selecionarProdutoCompra(e.target.value)}
                  list="listaProdCodCompra"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                  }}
                />
                <datalist id="listaProdCodCompra">
                  {produtos.map((p) => (
                    <option key={p.codProduto} value={p.codProduto}>
                      {p.nome}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Produto
                </label>
                <input
                  type="text"
                  value={novaCompra.produto}
                  onChange={(e) =>
                    setNovaCompra((prev) => ({
                      ...prev,
                      produto: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={novaCompra.fornecedor}
                  onChange={(e) =>
                    setNovaCompra((prev) => ({
                      ...prev,
                      fornecedor: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    backgroundColor: isReposicaoLoja ? '#f3f4f6' : '#ffffff',
                    color: isReposicaoLoja ? '#9ca3af' : '#111827',
                  }}
                  disabled={isReposicaoLoja}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                fontSize: '13px',
                marginBottom: '8px',
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Quantidade
                </label>
                <input
                  type="number"
                  min={1}
                  value={novaCompra.qtde}
                  onChange={(e) =>
                    setNovaCompra((prev) => ({
                      ...prev,
                      qtde: Number(e.target.value || 0),
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Valor Total (R$){' '}
                  {isReposicaoLoja && (
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>
                      (não usado)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={isReposicaoLoja ? 0 : valorTotalCalculado}
                  readOnly
                  disabled
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#f3f4f6',
                    color: '#111827',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Valor Unitário cadastrado:
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#111827' }}>
                    {isReposicaoLoja
                      ? formatarReal(valorUnitarioAtual || 0)
                      : formatarReal(valorUnitarioAtual || 0)}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={registrarCompra}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Registrar Compra / Reposição e Atualizar Estoque
            </button>
          </div>

          {/* Lado DIREITO: Foto do produto na compra/transferência */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: 4,
              }}
            >
              Foto do Produto
            </div>
            <div
              style={{
                border: '2px solid #111827',
                borderRadius: '8px',
                width: '100%',
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#f9fafb',
              }}
            >
              {fotoCompraUrl ? (
                <img
                  src={fotoCompraUrl}
                  alt="Foto do produto"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    textAlign: 'center',
                    padding: '4px',
                  }}
                >
                  Ao selecionar um produto com foto cadastrada, a imagem
                  aparecerá aqui.
                </span>
              )}
            </div>
          </div>
        </div>
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

  // --- Cálculo de parcelas em atraso a partir da data de início ---
  const calcularParcelasEmAtraso = (p) => {
    if (!p.dataInicio) return 0;
    const inicio = new Date(p.dataInicio);
    inicio.setHours(0, 0, 0, 0);

    // ainda não chegou a primeira parcela
    if (inicio > hoje) return 0;

    const anoDiff = hoje.getFullYear() - inicio.getFullYear();
    const mesDiff = hoje.getMonth() - inicio.getMonth();
    let parcelasVencidas = anoDiff * 12 + mesDiff + 1; // +1 conta o mês inicial

    if (parcelasVencidas < 0) parcelasVencidas = 0;
    if (p.parcelas && parcelasVencidas > p.parcelas) {
      parcelasVencidas = p.parcelas;
    }
    return parcelasVencidas;
  };

  // Aplica regras de atraso / status em memória
  const promissoriasCalculadas = promissorias.map((p) => {
    const atrasadas = calcularParcelasEmAtraso(p);
    const saldo = Number(p.valor || 0);

    let statusCalc = p.status || 'ABERTO';
    if (saldo <= 0) {
      statusCalc = 'QUITADO';
    } else if (atrasadas > 0) {
      statusCalc = 'PENDENTE';
    } else {
      statusCalc = 'ABERTO';
    }

    return {
      ...p,
      parcelasAtrasadas: atrasadas,
      statusCalc,
    };
  });

  // Remove da visualização as já quitadas
  let listaFiltradaBase = promissoriasCalculadas.filter(
    (p) => p.statusCalc !== 'QUITADO'
  );

  // Filtro "somente atrasadas"
  const listaFiltrada = listaFiltradaBase.filter((p) => {
    if (!mostrarSomenteAtrasadas) return true;
    return p.parcelasAtrasadas > 0;
  });

  // Selecionar / desmarcar para e-mail
  const toggleSelecao = async (index) => {
    const prom = promissorias[index];
    if (!prom) return;

    const novoSelecionado = !prom.selecionado;

    setPromissorias((lista) =>
      lista.map((p, idx) =>
        idx === index ? { ...p, selecionado: novoSelecionado } : p
      )
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
    const selecionados = promissoriasCalculadas.filter((p) => p.selecionado);
    if (selecionados.length === 0) {
      alert('Nenhuma promissória selecionada.');
      return;
    }
    const emails = selecionados
      .map((p) => `${p.cliente} <${p.email}>`)
      .join('\n');
    alert(
      `Simulação de envio de e-mails para:\n\n${emails}\n\n(na implementação real, aqui integraria com um serviço de e-mail)`
    );
  };

  // Consolidação por cliente (usa apenas lista filtrada atual)
  const consolidadoPorCliente = Object.values(
    listaFiltrada.reduce((acc, p) => {
      if (!acc[p.cliente]) {
        acc[p.cliente] = {
          cliente: p.cliente,
          email: p.email,
          total: 0,
          atrasadas: 0,
        };
      }
      acc[p.cliente].total += Number(p.valor || 0);
      acc[p.cliente].atrasadas += Number(p.parcelasAtrasadas || 0);
      return acc;
    }, {})
  );

  // Impressão / PDF (somente o que está filtrado na tela)
  const imprimirPromissorias = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const linhasHtml = listaFiltrada
      .map((p) => {
        return `
          <tr>
            <td style="text-align:center;">${p.nrVenda || ''}</td>
            <td style="text-align:center;">${p.cliente || ''}</td>
            <td style="text-align:center;">${p.email || ''}</td>
            <td style="text-align:center;">${formatarReal(p.valor)}</td>
            <td style="text-align:center;">
              ${p.dataInicio ? formatarDataBR(p.dataInicio) : ''}
            </td>
            <td style="text-align:center;">${p.parcelas || 0}</td>
            <td style="text-align:center;">${p.parcelasAtrasadas || 0}</td>
            <td style="text-align:center;">${p.statusCalc}</td>
          </tr>
        `;
      })
      .join('');

    const hojeStr = formatarDataBR(new Date().toISOString().slice(0, 10));

    win.document.write(`
      <html>
        <head>
          <title>Promissórias</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h1 { font-size: 18px; margin-bottom: 4px; text-align:center; }
            h2 { font-size: 13px; margin-top: 4px; text-align:center; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: center; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <div style="text-align:center;">
            <img src="/logo-wolves.png" alt="Logo" style="width:90px;height:90px;object-fit:contain;border-radius:50%;"/>
            <h1>Promissórias em Aberto</h1>
            <h2>Emitido em ${hojeStr}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nr Venda</th>
                <th>Cliente</th>
                <th>E-mail</th>
                <th>Saldo Devedor</th>
                <th>Data inicial de pagamento</th>
                <th>Parcelas</th>
                <th>Parcelas em atraso</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                linhasHtml ||
                '<tr><td colspan="8">Nenhuma promissória para os filtros atuais.</td></tr>'
              }
            </tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-6 space-y-6" style={appStyle}>
      <div className="bg-white rounded-lg shadow p-6">
        {/* Título + filtros topo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Promissórias em Aberto</h2>
            <p className="text-sm text-gray-600">
              Selecione as vendas para contato e acompanhe quem está com parcelas atrasadas.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 text-xs md:text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mostrarSomenteAtrasadas}
                onChange={(e) => setMostrarSomenteAtrasadas(e.target.checked)}
              />
              Mostrar apenas com parcelas em atraso
            </label>
            <div className="flex gap-2">
              <button
                onClick={enviarEmails}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs"
              >
                <Mail className="w-4 h-4" />
                e-mails
              </button>
              <button
                onClick={imprimirPromissorias}
                className="bg-black hover:bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-bold"
              >
                ExportarPDF3
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de promissórias */}
        <div className="overflow-x-auto text-xs mb-6">
          <table className="w-full text-[11px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-center">
                  <input type="checkbox" disabled />
                </th>
                <th className="px-2 py-2 text-center">Nr Venda</th>
                <th className="px-2 py-2 text-center">Cliente</th>
                <th className="px-2 py-2 text-center">E-mail</th>
                <th className="px-2 py-2 text-center">Saldo Devedor</th>
                <th className="px-2 py-2 text-center">Data inicial de pagamento</th>
                <th className="px-2 py-2 text-center">Parcelas</th>
                <th className="px-2 py-2 text-center">Parcelas em atraso</th>
                <th className="px-2 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((prom, idx) => {
                const indexOriginal = promissorias.findIndex(
                  (p) =>
                    p.nrVenda === prom.nrVenda && p.cliente === prom.cliente
                );

                // COR DA LINHA QUANDO PENDENTE
                const linhaPendente =
                  prom.statusCalc === 'PENDENTE' ? 'bg-yellow-100' : '';

                const atrasoClass =
                  (prom.parcelasAtrasadas || 0) > 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800';

                const statusClass =
                  prom.statusCalc === 'PENDENTE'
                    ? 'bg-yellow-200 text-yellow-900'
                    : 'bg-blue-100 text-blue-800';

                return (
                  <tr
                    key={idx}
                    className={`border-b hover:bg-gray-50 ${linhaPendente}`}
                  >
                    <td className="px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={prom.selecionado || false}
                        onChange={() => toggleSelecao(indexOriginal)}
                      />
                    </td>
                    <td className="px-2 py-1 text-center font-semibold">
                      {prom.nrVenda}
                    </td>
                    <td className="px-2 py-1 text-center">{prom.cliente}</td>
                    <td className="px-2 py-1 text-center text-[10px] text-gray-600">
                      {prom.email}
                    </td>
                    <td className="px-2 py-1 text-center font-semibold">
                      {formatarReal(prom.valor)}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {prom.dataInicio ? formatarDataBR(prom.dataInicio) : ''}
                    </td>
                    <td className="px-2 py-1 text-center">{prom.parcelas}</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] ${atrasoClass}`}>
                        {prom.parcelasAtrasadas}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] ${statusClass}`}>
                        {prom.statusCalc}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {listaFiltrada.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-4 text-center text-[11px] text-gray-500"
                  >
                    Nenhuma promissória encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Consolidação por cliente */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Consolidação por Cliente (somente filtrados acima)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] md:text-xs border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-center">Cliente</th>
                  <th className="px-3 py-2 text-center">E-mail</th>
                  <th className="px-3 py-2 text-center">Total em aberto</th>
                  <th className="px-3 py-2 text-center">Parcelas em Atraso</th>
                </tr>
              </thead>
              <tbody>
                {consolidadoPorCliente.map((c, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-1 text-center">{c.cliente}</td>
                    <td className="px-3 py-1 text-center text-[10px]">
                      {c.email}
                    </td>
                    <td className="px-3 py-1 text-center font-semibold">
                      {formatarReal(c.total)}
                    </td>
                    <td className="px-3 py-1 text-center">{c.atrasadas}</td>
                  </tr>
                ))}
                {consolidadoPorCliente.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-3 text-center text-[11px] text-gray-500"
                    >
                      Nenhuma promissória para consolidar com os filtros atuais.
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

  // ======================================================================
  // TELA DE USUÁRIOS (APENAS ADM)
  // ======================================================================
  const TelaUsuarios = () => {
    const [novoUsuario, setNovoUsuario] = useState({
      login: '',
      nome: '',
      perfil: 'VENDA',
      senha: '',
    });

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
      if (!novoUsuario.login || !novoUsuario.nome || !novoUsuario.senha) {
        alert('Preencha login, nome e senha.');
        return;
      }

      const existe = usuarios.some(
        (u) => u.login.toLowerCase() === novoUsuario.login.toLowerCase(),
      );
      if (existe) {
        alert('Já existe um usuário com esse login.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('usuarios')
          .insert({
            login: novoUsuario.login,
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

        setUsuarios((lista) => [...lista, data]);

        alert('Usuário criado com sucesso!');

        setNovoUsuario({
          login: '',
          nome: '',
          perfil: 'VENDA',
          senha: '',
        });
      } catch (e) {
        console.error('Erro inesperado ao criar usuário:', e);
        alert('Erro inesperado ao criar usuário na nuvem.');
      }
    };

    const alterarSenha = async (id, login) => {
      const novaSenha = window.prompt(
        `Digite a nova senha para o usuário "${login}":`,
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

        setUsuarios((lista) =>
          lista.map((u) =>
            u.id === id ? { ...u, senha_hash: novaSenha } : u,
          ),
        );

        alert('Senha atualizada com sucesso!');
      } catch (e) {
        console.error('Erro inesperado ao atualizar senha:', e);
        alert('Erro inesperado ao atualizar senha na nuvem.');
      }
    };

    const excluirUsuario = async (id, login) => {
      const confirma = window.confirm(
        `Tem certeza que deseja excluir o usuário "${login}"?`,
      );
      if (!confirma) return;

      try {
        const { error } = await supabase
          .from('usuarios')
          .delete()
          .eq('id', id);

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
            Crie novos logins para administradores, gerentes ou vendedores e altere
            senhas dos usuários existentes.
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
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Login</label>
              <input
                type="text"
                value={novoUsuario.login}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, login: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="ex: venda3"
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
              <label className="block font-semibold mb-1 mt-2 md:mt-0">Senha</label>
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
            Criar Usuário
          </button>
        </div>

        {/* Lista de usuários */}
        <div className="bg-white rounded-lg shadow p-6 text-sm">
          <h3 className="text-lg font-semibold mb-3">Usuários cadastrados</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-center">Login</th>
                  <th className="px-3 py-2 text-center">Nome</th>
                  <th className="px-3 py-2 text-center">Perfil</th>
                  <th className="px-3 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-center font-mono text-xs">
                      {u.login}
                    </td>
                    <td className="px-3 py-2 text-center">{u.nome}</td>
                    <td className="px-3 py-2 text-center">{u.perfil}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => alterarSenha(u.id, u.login)}
                          className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Alterar senha
                        </button>
                        <button
                          onClick={() => excluirUsuario(u.id, u.login)}
                          className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
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
