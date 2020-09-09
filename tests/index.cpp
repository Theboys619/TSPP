#include <iostream>
#include <string>
#include <chrono>
#include <variant>

/* Start of TYPESCRIPT NUMBER struct */

struct TSNumber {
  int a;
  float b;

  int type;

  TSNumber() {};

  TSNumber(int x) {
    a = x;
    type = 1;
  }
  TSNumber(float x) {
    b = x;
    type = 0;
  }
  TSNumber(double x) {
    b = (float)x;
    type = 0;
  }


  int operator+= (int x) {
    a += x;
    type = 1;
    return a;
  }
  float operator+= (float x) {
    b += x;
    type = 1;
    return b;
  }
  

  int operator-= (int x) {
    a -= x;
    type = 1;
    return a;
  }
  float operator-= (float x) {
    b -= x;
    type = 1;
    return b;
  }
  

  int operator*= (int x) {
    a *= x;
    type = 1;
    return a;
  }
  float operator*= (float x) {
    b *= x;
    type = 1;
    return b;
  }


  int operator/= (int x) {
    a /= x;
    type = 1;
    return a;
  }
  float operator/= (float x) {
    b /= x;
    type = 0;
    return b;
  }


  int operator%= (int x) {
    a %= x;
    type = 1;
    return a;
  }


  int operator= (int x) {
    a = x;
    type = 1;
    return a;
  }
  float operator= (float x) {
    b = x;
    a = 0;
    type = 0;
    return b;
  }
  float operator= (double x) {
    b = (float)x;
    a = 0;
    type = 0;
    return b;
  }


  bool operator< (int x) {
    return a < x;
  }
  bool operator< (float x) {
    return b < x;
  }
  bool operator< (TSNumber x) {
    if (type == 1) {
      return a < x.a;
    } else {
      return b < x.b;
    }
  }


  bool operator> (int x) {
    return a > x;
  }
  bool operator> (float x) {
    return b > x;
  }
  bool operator> (TSNumber x) {
    if (type == 1) {
      return a > x.a;
    } else {
      return b > x.b;
    }
  }


  bool operator<= (int x) {
    return a <= x;
  }
  bool operator<= (float x) {
    return b <= x;
  }
  bool operator<= (TSNumber x) {
    if (type == 1) {
      return a <= x.a;
    } else {
      return b <= x.b;
    }
  }


  bool operator>= (int x) {
    return a >= x;
  }
  bool operator>= (float x) {
    return b >= x;
  }
  bool operator>= (TSNumber x) {
    if (type == 1) {
      return a >= x.a;
    } else {
      return b >= x.b;
    }
  }

  
  bool operator== (TSNumber x) {
    if (type == 1) {
      return a == x.a;
    } else {
      return b == x.b;
    }
  }


  TSNumber operator- (TSNumber x) {
    if (type == 1) {
      return TSNumber(a - x.a);
    }

    return TSNumber(b - x.b);
  }


  TSNumber operator+ (TSNumber x) {
    if (type == 1) {
      return TSNumber(a + x.a);
    }

    return TSNumber(b + x.b);
  }


  TSNumber operator* (TSNumber x) {
    if (type == 1) {
      return TSNumber(a * x.a);
    }

    return TSNumber(b * x.b);
  }


  TSNumber operator/ (TSNumber x) {
    if (type == 1) {
      return TSNumber(a / x.a);
    }

    return TSNumber(b / x.b);
  }


  TSNumber operator++ () {
    if (type == 0) {
      b++;
      
      return (*this);
    }
    a++;

    return (*this);
  }

  TSNumber operator++ (int) {
    if (type == 0) {
      ++b;

      return (*this);
    }
    ++a;

    return (*this);
  }


  TSNumber operator-- () {
    if (type == 0) {
      b--;
      
      return (*this);
    }
    a--;

    return (*this);
  }

  TSNumber operator-- (int) {
    if (type == 0) {
      --b;

      return (*this);
    }
    --a;

    return (*this);
  }
  

  std::string operator<< (std::string x) {
    if (type == 1) {
      return x + std::string(sizeof(a), a);
    } else {
      return x + std::string(sizeof(b), b);
    }
  }
};

/* End of TYPESCRIPT NUMBER struct */

/* Start of CONSOLE Object */

class Console {
  public:
  Console();

  void log(std::string msg);
  void log(const char* msg);
  void log(int msg);
  void log(float msg);
  void log(bool msg);
  void log(TSNumber msg);

  template <typename T, typename ... Args>
  void log(T arg, Args... args);
};

Console::Console() {};

void Console::log(const char* msg) {
  std::cout << msg << std::endl;
}

void Console::log(std::string msg) {
  std::cout << msg << std::endl;
}

void Console::log(int msg) {
  std::cout << msg << std::endl;
}

void Console::log(float msg) {
  std::cout << msg << std::endl;
}

void Console::log(bool msg) {
  std::string boolstr = "false";
  if (msg == 1) boolstr = "true";
  std::cout << boolstr << std::endl;
}

void Console::log(TSNumber msg) {
  if (msg.type == 1) {
    std::cout << msg.a << std::endl;
  } else {
    std::cout << msg.b << std::endl;
  }
}

template <typename T, typename ... Args>
void Console::log(T arg, Args... args) {
  std::cout << arg << " ";

  this->log(args...);

  std::cout << "\n";
}

Console console = Console();

/* End of CONSOLE Object */

TSNumber factorial(TSNumber x) {
if (x == TSNumber(1)) {
return TSNumber(1);

}
return x * factorial(x - TSNumber(1));

}


int main(int argc, char** argv) {
TSNumber x = TSNumber(5);
x++;
x--;
console.log(factorial(x));

  return 0;
}