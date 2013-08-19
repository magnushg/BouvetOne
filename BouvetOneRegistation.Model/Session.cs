using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BouvetOneRegistation.Model
{
    public class Session
    {
        public string Name;
        public string Title;
        public string Description;
    }

    public enum Level
    {
        Beginner,
        Intermediate,
        Advanced
    }
}
